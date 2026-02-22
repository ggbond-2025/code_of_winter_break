package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.ItemService;
import com.campus.lostfound.service.SystemConfigService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemServiceImpl implements ItemService {

    private final LostItemRepository lostItemRepository;
    private final UserRepository userRepository;
    private final SystemConfigService systemConfigService;

    public ItemServiceImpl(LostItemRepository lostItemRepository, UserRepository userRepository, SystemConfigService systemConfigService) {
        this.lostItemRepository = lostItemRepository;
        this.userRepository = userRepository;
        this.systemConfigService = systemConfigService;
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
            if (hasForbiddenWord(combined)) throw new IllegalArgumentException("内容包含违禁词");
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

        return lostItemRepository.save(item);
    }

    private boolean hasForbiddenWord(String content) {
        if (content == null) return false;
        String c = content.toLowerCase();
        return c.contains("广告") || c.contains("代购") || c.contains("赌博") || c.contains("色情") || c.contains("诈骗");
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

        return lostItemRepository.save(item);
    }

    @Override
    public void cancel(Long userId, Long itemId) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        if (!item.getCreator().getId().equals(userId)) {
            throw new IllegalArgumentException("只能取消自己的发布");
        }
        item.setStatus("CANCELLED");
        lostItemRepository.save(item);
    }

    @Override
    public void deleteByUser(Long userId, Long itemId) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        if (!item.getCreator().getId().equals(userId)) {
            throw new IllegalArgumentException("只能删除自己的发布");
        }
        if (!"PENDING".equals(item.getStatus()) && !"REJECTED".equals(item.getStatus())) {
            throw new IllegalArgumentException("只有待审核或已驳回的记录可以删除");
        }
        lostItemRepository.delete(item);
    }
}
