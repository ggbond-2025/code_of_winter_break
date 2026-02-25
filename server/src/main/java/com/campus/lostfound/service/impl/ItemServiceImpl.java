package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.ItemService;
import com.campus.lostfound.service.SystemConfigService;
import com.campus.lostfound.service.SystemNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemServiceImpl implements ItemService {

    private final LostItemRepository lostItemRepository;
    private final UserRepository userRepository;
    private final SystemConfigService systemConfigService;
    private final SystemNotificationService systemNotificationService;

    public ItemServiceImpl(LostItemRepository lostItemRepository,
                           UserRepository userRepository,
                           SystemConfigService systemConfigService,
                           SystemNotificationService systemNotificationService) {
        this.lostItemRepository = lostItemRepository;
        this.userRepository = userRepository;
        this.systemConfigService = systemConfigService;
        this.systemNotificationService = systemNotificationService;
    }

    @Override
    public LostItem create(Long userId, String title, String description, String category,
                           String location, String lostTime, String type,
                           String contactName, String contactPhone,
                           String features, String imageUrls, Double reward, String storageLocation) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        SystemConfig cfg = systemConfigService.getConfig();
        if (cfg.getPublishCooldownMinutes() != null && cfg.getPublishCooldownMinutes() > 0) {
            LostItem last = lostItemRepository.findTopByCreatorIdOrderByCreatedAtDesc(userId);
            if (last != null && last.getCreatedAt() != null) {
                long diff = java.time.Duration.between(last.getCreatedAt(), java.time.LocalDateTime.now()).toMinutes();
                if (diff < cfg.getPublishCooldownMinutes()) {
                    throw new IllegalArgumentException("发布过于频繁，请稍后再试");
                }
            }
        }
        if (cfg.isRequireImage()) {
            String imgs = imageUrls == null ? "" : imageUrls.trim();
            if (imgs.isEmpty()) throw new IllegalArgumentException("请上传图片");
        } else {
            String imgs = imageUrls == null ? "" : imageUrls.trim();
            if (!imgs.isEmpty()) throw new IllegalArgumentException("当前不允许上传图片");
        }
        if (cfg.isRequireLocationDetail()) {
            String loc = location == null ? "" : location.trim();
            if (!loc.contains("—") || loc.endsWith("—") || loc.endsWith("— ")) {
                throw new IllegalArgumentException("请填写具体地点");
            }
        }
        if (cfg.isEnableDescLimit()) {
            String desc = description == null ? "" : description.trim();
            if (cfg.getDescMaxLength() != null && cfg.getDescMaxLength() > 0 && desc.length() > cfg.getDescMaxLength()) {
                throw new IllegalArgumentException("物品介绍字数超限");
            }
        }
        if (cfg.isForbidWordCheck()) {
            String combined = (title == null ? "" : title) + " " + (description == null ? "" : description);
            if (systemConfigService.containsForbiddenWord(combined)) {
                throw new IllegalArgumentException("信息包含违禁词，请重新发布");
            }
        }

        LostItem item = new LostItem();
        item.setTitle(title);
        item.setDescription(description);
        item.setCategory(category);
        item.setLocation(location);
        item.setLostTime(lostTime != null && !lostTime.isEmpty() ? lostTime : "");
        item.setType(type != null ? type : "LOST");
        item.setStatus(cfg.isEnableReview() ? "PENDING" : "APPROVED");
        item.setContactName(contactName);
        item.setContactPhone(contactPhone);
        item.setFeatures(features);
        item.setImageUrls(imageUrls);
        item.setReward(reward);
        item.setStorageLocation(storageLocation);
        item.setCreator(user);

        LostItem saved = lostItemRepository.save(item);
        sendBizNotice(userId,
            postNoticeObject(saved),
            "发布成功",
            safeStatus(saved.getStatus()),
            "你发布的帖子已提交成功");
        return saved;
    }

    @Override
    public Page<LostItem> publicList(String keyword, String status, String category, String type, String location, int page, int size) {
        String effectiveLocation = location == null ? "" : location;
        String kw = keyword == null ? "" : keyword;
        String cat = category == null ? "" : category;
        String tp = type == null ? "" : type;
        List<String> publicStatuses = List.of("CLAIM_ADMIN_REVIEW", "CLAIM_OWNER_REVIEW", "APPROVED", "MATCHED");
        if (status == null || status.isEmpty()) {
            return lostItemRepository.searchByStatuses(kw, publicStatuses, cat, tp, effectiveLocation, PageRequest.of(page, size));
        }
        if (!publicStatuses.contains(status)) {
            return Page.empty(PageRequest.of(page, size));
        }
        return lostItemRepository.search(kw, status, cat, tp, effectiveLocation, PageRequest.of(page, size));
    }

    @Override
    public LostItem getById(Long id) {
        return lostItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
    }

    @Override
    public Page<LostItem> myItems(Long userId, int page, int size) {
        return lostItemRepository.findByCreatorIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
    }

    @Override
    public LostItem update(Long userId, Long itemId, String title, String description, String category,
                           String location, String lostTime, String features, String contactName, String contactPhone,
                           String imageUrls, Double reward, String storageLocation) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        String oldStatus = item.getStatus();
        if (!item.getCreator().getId().equals(userId)) {
            throw new IllegalArgumentException("只能修改自己的发布");
        }

        boolean canEditAll = "PENDING".equals(item.getStatus()) || "REJECTED".equals(item.getStatus());
        boolean approved = "APPROVED".equals(item.getStatus());

        if (!canEditAll && !approved) {
            throw new IllegalArgumentException("当前状态不允许修改");
        }

        if (description != null) item.setDescription(description);

        if (canEditAll) {
            if (title != null)          item.setTitle(title);
            if (category != null)       item.setCategory(category);
            if (location != null)       item.setLocation(location);
            if (lostTime != null)       item.setLostTime(lostTime);
            if (features != null)       item.setFeatures(features);
            if (contactName != null)    item.setContactName(contactName);
            if (contactPhone != null)   item.setContactPhone(contactPhone);
            if (imageUrls != null)      item.setImageUrls(imageUrls);
            if (reward != null)         item.setReward(reward);
            if (storageLocation != null) item.setStorageLocation(storageLocation);
            item.setStatus("PENDING");
        }

        LostItem saved = lostItemRepository.save(item);
        notifyPostStatusChanged(saved, oldStatus, saved.getStatus(), "你已修改帖子");
        return saved;
    }

    @Override
    public void cancel(Long userId, Long itemId) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        if (!item.getCreator().getId().equals(userId)) {
            throw new IllegalArgumentException("只能取消自己的发布");
        }
        String oldStatus = item.getStatus();
        item.setStatus("CANCELLED");
        LostItem saved = lostItemRepository.save(item);
        notifyPostStatusChanged(saved, oldStatus, saved.getStatus(), "你已取消发布该帖子");
    }

    @Override
    public LostItem republish(Long userId, Long itemId) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        if (!item.getCreator().getId().equals(userId)) {
            throw new IllegalArgumentException("只能重新发布自己的帖子");
        }
        if (!"CANCELLED".equals(item.getStatus())) {
            throw new IllegalArgumentException("只有已取消的帖子可以重新发布");
        }
        String oldStatus = item.getStatus();
        SystemConfig cfg = systemConfigService.getConfig();
        item.setStatus(cfg.isEnableReview() ? "PENDING" : "APPROVED");
        LostItem saved = lostItemRepository.save(item);
        notifyPostStatusChanged(saved, oldStatus, saved.getStatus(), "你已重新发布该帖子");
        return saved;
    }

    @Override
    public void deleteByUser(Long userId, Long itemId) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        if (!item.getCreator().getId().equals(userId)) {
            throw new IllegalArgumentException("只能删除自己的发布");
        }
        if (!"PENDING".equals(item.getStatus()) && !"REJECTED".equals(item.getStatus()) && !"CANCELLED".equals(item.getStatus())) {
            throw new IllegalArgumentException("只有待审核、已驳回或已取消的记录可以删除");
        }
        sendBizNotice(userId,
            postNoticeObject(item),
            "删除帖子",
            "已删除",
            "你已删除该帖子");
        lostItemRepository.delete(item);
    }

    private void notifyPostStatusChanged(LostItem item, String oldStatus, String newStatus, String extra) {
        if (item == null || item.getCreator() == null || newStatus == null || newStatus.equals(oldStatus)) return;
        String detail = (extra == null || extra.isBlank())
            ? String.format("状态由 %s 变更为 %s", safeStatus(oldStatus), safeStatus(newStatus))
            : String.format("状态由 %s 变更为 %s；%s", safeStatus(oldStatus), safeStatus(newStatus), extra);
        sendBizNotice(item.getCreator().getId(),
            postNoticeObject(item),
            "状态变更",
            safeStatus(newStatus),
            detail);
    }

    private void sendUserNotice(Long userId, String content) {
        if (userId == null || content == null || content.isBlank()) return;
        systemNotificationService.send(userId, userId, "USER", content);
    }

    private void sendBizNotice(Long userId, String object, String event, String state, String detail) {
        sendUserNotice(userId,
                String.format("【系统通知】对象：%s；事件：%s；状态：%s；说明：%s。",
                        safeText(object), safeText(event), safeText(state), safeText(detail)));
    }

    private String safeTitle(LostItem item) {
        return item == null || item.getTitle() == null || item.getTitle().isBlank() ? "未命名帖子" : item.getTitle();
    }

    private String postNoticeObject(LostItem item) {
        String id = item != null && item.getId() != null ? String.valueOf(item.getId()) : "0";
        return postTypeLabel(item) + "《" + safeTitle(item) + "》#" + id;
    }

    private String postTypeLabel(LostItem item) {
        return item != null && "LOST".equals(item.getType()) ? "寻物启事" : "失物招领";
    }

    private String safeStatus(String status) {
        if (status == null || status.isBlank()) return "未知状态";
        return switch (status) {
            case "PENDING" -> "待审核";
            case "ADMIN_APPROVED" -> "待发布者审核";
            case "CLAIM_ADMIN_REVIEW" -> "管理员审核申请中";
            case "CLAIM_OWNER_REVIEW" -> "发布人审核申请中";
            case "APPROVED" -> "未匹配";
            case "REJECTED" -> "已驳回";
            case "MATCHED" -> "已匹配";
            case "CLAIMED" -> "已认领";
            case "ARCHIVED" -> "已归档";
            case "CANCELLED" -> "已取消";
            case "ADMIN_DELETED" -> "管理员删除";
            default -> status;
        };
    }

    private String safeText(String text) {
        return text == null || text.isBlank() ? "无" : text;
    }
}
