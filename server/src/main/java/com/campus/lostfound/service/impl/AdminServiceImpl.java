package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.model.ClaimRecord;
import com.campus.lostfound.repository.ChatMessageRepository;
import com.campus.lostfound.repository.ClaimRecordRepository;
import com.campus.lostfound.repository.ComplaintRecordRepository;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.service.AdminService;
import com.campus.lostfound.service.SystemConfigService;
import com.campus.lostfound.service.SystemNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    private final LostItemRepository lostItemRepository;
    private final ClaimRecordRepository claimRecordRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ComplaintRecordRepository complaintRecordRepository;
    private final SystemConfigService systemConfigService;
    private final SystemNotificationService systemNotificationService;

    public AdminServiceImpl(LostItemRepository lostItemRepository,
                            ClaimRecordRepository claimRecordRepository,
                            ChatMessageRepository chatMessageRepository,
                            ComplaintRecordRepository complaintRecordRepository,
                            SystemConfigService systemConfigService,
                            SystemNotificationService systemNotificationService) {
        this.lostItemRepository = lostItemRepository;
        this.claimRecordRepository = claimRecordRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.complaintRecordRepository = complaintRecordRepository;
        this.systemConfigService = systemConfigService;
        this.systemNotificationService = systemNotificationService;
    }

    @Override
    public Page<LostItem> allItems(String keyword, String status, String category, String type, String location, Integer days, int page, int size) {
        String effectiveLocation = location == null ? "" : location;
        LocalDateTime threshold = (days != null && days > 0) ? LocalDateTime.now().minusDays(days) : null;
        return lostItemRepository.searchWithTime(keyword, status, category, type, effectiveLocation, threshold, PageRequest.of(page, size));
    }

    @Override
    public LostItem approve(Long itemId) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        ensureNotArchived(item);
        String oldStatus = item.getStatus();
        item.setStatus("APPROVED");
        item.setRejectReason(null);
        LostItem saved = lostItemRepository.save(item);
        notifyPostStatusChanged(saved, oldStatus, saved.getStatus(), "管理员已通过审核");
        return saved;
    }

    @Override
    public LostItem reject(Long itemId, String reason) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        ensureNotArchived(item);
        String oldStatus = item.getStatus();
        item.setStatus("REJECTED");
        item.setRejectReason(reason);
        LostItem saved = lostItemRepository.save(item);
        notifyPostStatusChanged(saved, oldStatus, saved.getStatus(), "管理员驳回：" + (reason == null ? "" : reason));
        return saved;
    }

    @Override
    @Transactional
    public LostItem archive(Long itemId, String method) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        if ("ARCHIVED".equals(item.getStatus())) {
            throw new IllegalArgumentException("已归档的物品状态不可修改");
        }
        String oldStatus = item.getStatus();
        item.setStatus("ARCHIVED");
        String m = method == null ? "" : method.trim();
        if (m.isEmpty()) m = "仅设置归档";
        if (m.startsWith("归档后延时") && m.endsWith("删除")) {
            m = "归档后延时删除";
        }
        item.setArchiveMethod(m);
        if ("归档后删除".equals(m)) {
            sendBizNotice(item.getCreator() != null ? item.getCreator().getId() : null,
                postNoticeObject(item),
                "状态变更",
                safeStatus("ARCHIVED"),
                String.format("状态由 %s 变更为 %s；管理员设置归档后立即删除", safeStatus(oldStatus), safeStatus("ARCHIVED")));
            deleteItemWithRefsCleaned(item);
            return item;
        }
        LostItem saved = lostItemRepository.save(item);
        notifyPostStatusChanged(saved, oldStatus, saved.getStatus(), "管理员设置归档");
        return saved;
    }

    @Override
    public LostItem deleteItem(Long itemId, String reason) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        ensureNotArchived(item);
        String r = reason == null ? "" : reason.trim();
        if (r.isEmpty()) {
            throw new IllegalArgumentException("删除理由不能为空");
        }
        String oldStatus = item.getStatus();
        item.setStatus("ADMIN_DELETED");
        item.setRejectReason(r);
        LostItem saved = lostItemRepository.save(item);
        notifyPostStatusChanged(saved, oldStatus, saved.getStatus(), "管理员删除原因：" + r);
        return saved;
    }

    @Override
    public LostItem updateInfo(Long itemId, String storageLocation, String contactName, String contactPhone) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        if (storageLocation != null) item.setStorageLocation(storageLocation);
        if (contactName != null)     item.setContactName(contactName);
        if (contactPhone != null)    item.setContactPhone(contactPhone);
        return lostItemRepository.save(item);
    }

    @Override
    public LostItem updateItemStatus(Long itemId, String status) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        ensureNotArchived(item);
        if ("CANCELLED".equals(item.getStatus())) {
            throw new IllegalArgumentException("已取消的物品无法修改状态");
        }
        String s = status == null ? "" : status.toUpperCase();
        if (!java.util.Set.of("APPROVED", "MATCHED", "CLAIMED").contains(s)) {
            throw new IllegalArgumentException("无效的状态");
        }
        String oldStatus = item.getStatus();
        item.setStatus(s);
        LostItem saved = lostItemRepository.save(item);
        notifyPostStatusChanged(saved, oldStatus, saved.getStatus(), "管理员手动更改状态");
        return saved;
    }

    private void ensureNotArchived(LostItem item) {
        if (item != null && "ARCHIVED".equals(item.getStatus())) {
            throw new IllegalArgumentException("已归档的物品状态不可修改");
        }
    }

    @Override
    public Map<String, Object> stats() {
        return Map.of(
                "totalItems", lostItemRepository.count(),
                "pendingItems", lostItemRepository.countByStatus("PENDING"),
                "approvedItems", lostItemRepository.countByStatus("APPROVED"),
                "claimedItems", lostItemRepository.countByStatus("CLAIMED"),
                "archivedItems", lostItemRepository.countByStatus("ARCHIVED"),
                "lostCount", lostItemRepository.countByType("LOST"),
                "foundCount", lostItemRepository.countByType("FOUND"),
                "pendingClaims", claimRecordRepository.countByStatus("PENDING")
        );
    }

    @Override
    public List<LostItem> historyItems(String keyword, String type, String location, Integer days) {
        String kw = keyword == null ? "" : keyword.trim();
        String t = type == null ? "" : type.trim().toUpperCase();
        String loc = location == null ? "" : location.trim();
        LocalDateTime threshold = (days != null && days > 0) ? LocalDateTime.now().minusDays(days) : null;
        return lostItemRepository.findAll().stream()
                .filter(i -> !"PENDING".equals(i.getStatus()) && !"CANCELLED".equals(i.getStatus()))
                .filter(i -> t.isEmpty() || t.equalsIgnoreCase(i.getType()))
                .filter(i -> loc.isEmpty() || (i.getLocation() != null && i.getLocation().contains(loc)))
                .filter(i -> kw.isEmpty()
                        || (i.getTitle() != null && i.getTitle().contains(kw))
                        || (i.getDescription() != null && i.getDescription().contains(kw)))
                .filter(i -> threshold == null || (i.getUpdatedAt() != null && i.getUpdatedAt().isAfter(threshold)))
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    public LostItem updateItem(Long itemId, String title, String description, String category, String location,
                               String lostTime, String features, String contactName, String contactPhone,
                               String imageUrls, Double reward, String storageLocation) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        if ("ARCHIVED".equals(item.getStatus()) || "CLAIMED".equals(item.getStatus())) {
            throw new IllegalArgumentException("已归档或已认领的物品无法修改");
        }
        if (title != null) item.setTitle(title);
        if (description != null) item.setDescription(description);
        if (category != null) item.setCategory(category);
        if (location != null) item.setLocation(location);
        if (lostTime != null) item.setLostTime(lostTime);
        if (features != null) item.setFeatures(features);
        if (contactName != null) item.setContactName(contactName);
        if (contactPhone != null) item.setContactPhone(contactPhone);
        if (imageUrls != null) item.setImageUrls(imageUrls);
        if (reward != null) item.setReward(reward);
        if (storageLocation != null) item.setStorageLocation(storageLocation);
        return lostItemRepository.save(item);
    }

    @Override
    public Map<String, Object> statsOverview() {
        long totalItems = lostItemRepository.count();
        long foundCount = lostItemRepository.countByType("FOUND");
        long lostCount = lostItemRepository.countByType("LOST");
        long approvedItems = lostItemRepository.countByStatus("APPROVED");
        long matchedItems = lostItemRepository.countByStatus("MATCHED");
        long claimedItems = lostItemRepository.countByStatus("CLAIMED");
        long archivedItems = lostItemRepository.countByStatus("ARCHIVED");
        long rejectedItems = lostItemRepository.countByStatus("REJECTED");
        long pendingItems = lostItemRepository.countByStatus("PENDING");
        long cancelledItems = lostItemRepository.countByStatus("CANCELLED");
        double claimRate = totalItems == 0 ? 0 : ((double) claimedItems / (double) totalItems) * 100.0;

        List<LostItem> items = lostItemRepository.findAll();
        List<Map<String, Object>> monthlyStats = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = 11; i >= 0; i--) {
            YearMonth ym = YearMonth.from(now.minusMonths(i));
            int lost = 0;
            int found = 0;
            int total = 0;
            for (LostItem item : items) {
                if (item.getCreatedAt() == null) continue;
                YearMonth im = YearMonth.from(item.getCreatedAt());
                if (!im.equals(ym)) continue;
                total++;
                if ("LOST".equals(item.getType())) lost++;
                if ("FOUND".equals(item.getType())) found++;
            }
            Map<String, Object> row = new HashMap<>();
            row.put("label", ym.getMonthValue() + "月");
            row.put("lost", lost);
            row.put("found", found);
            row.put("total", total);
            monthlyStats.add(row);
        }

        Map<String, Object> statusCounts = new HashMap<>();
        statusCounts.put("PENDING", pendingItems);
        statusCounts.put("APPROVED", approvedItems);
        statusCounts.put("REJECTED", rejectedItems);
        statusCounts.put("MATCHED", matchedItems);
        statusCounts.put("CLAIMED", claimedItems);
        statusCounts.put("ARCHIVED", archivedItems);
        statusCounts.put("CANCELLED", cancelledItems);

        Map<String, Object> res = new HashMap<>();
        res.put("totalItems", totalItems);
        res.put("foundCount", foundCount);
        res.put("lostCount", lostCount);
        res.put("matchedItems", matchedItems);
        res.put("claimedItems", claimedItems);
        res.put("archivedItems", archivedItems);
        res.put("claimRate", claimRate);
        res.put("statusCounts", statusCounts);
        res.put("monthlyStats", monthlyStats);
        return res;
    }

    @Scheduled(cron = "0 10 2 * * *")
    public void autoArchiveUnmatchedItems() {
        SystemConfig cfg = systemConfigService.getConfig();
        int days = cfg.getClaimExpireDays() != null && cfg.getClaimExpireDays() > 0 ? cfg.getClaimExpireDays() : 30;
        LocalDateTime threshold = LocalDateTime.now().minusDays(days);
        List<String> autoArchiveStatuses = java.util.List.of("APPROVED", "MATCHED", "CLAIM_ADMIN_REVIEW", "CLAIM_OWNER_REVIEW");
        List<LostItem> candidates = lostItemRepository.findByStatusInAndUpdatedAtBefore(autoArchiveStatuses, threshold);
        for (LostItem item : candidates) {
            String oldStatus = item.getStatus();
            item.setStatus("ARCHIVED");
            item.setArchiveMethod("仅设置归档");
            LostItem saved = lostItemRepository.save(item);
            notifyPostStatusChanged(saved, oldStatus, saved.getStatus(), "系统根据认领时效自动归档");
        }
    }

    @Scheduled(cron = "0 30 2 * * *")
    @Transactional
    public void autoDeleteArchivedItems() {
        SystemConfig cfg = systemConfigService.getConfig();
        int days = cfg.getClaimExpireDays() != null && cfg.getClaimExpireDays() > 0 ? cfg.getClaimExpireDays() : 30;
        LocalDateTime threshold = LocalDateTime.now().minusDays(days);
        List<LostItem> archived = lostItemRepository.findByStatusAndUpdatedAtBefore("ARCHIVED", threshold);
        for (LostItem item : archived) {
            if (!isDelayedDeleteMethod(item.getArchiveMethod())) continue;
            deleteItemWithRefsCleaned(item);
        }
    }

    protected void deleteItemWithRefsCleaned(LostItem item) {
        if (item == null || item.getId() == null) return;
        List<ClaimRecord> claims = claimRecordRepository.findByItemIdOrderByCreatedAtDesc(item.getId());
        if (!claims.isEmpty()) {
            List<Long> claimIds = claims.stream().map(ClaimRecord::getId).filter(java.util.Objects::nonNull).toList();
            if (!claimIds.isEmpty()) {
                complaintRecordRepository.clearChatMessageReferenceByClaimIds(claimIds);
                chatMessageRepository.deleteByClaimIdIn(claimIds);
                complaintRecordRepository.clearClaimReferenceByClaimIds(claimIds);
            }
            claimRecordRepository.deleteByItemId(item.getId());
        }
        complaintRecordRepository.clearItemReferenceByItemId(item.getId());
        lostItemRepository.delete(item);
    }

    private boolean isDelayedDeleteMethod(String method) {
        if (method == null) return false;
        String m = method.trim();
        return "归档后延时删除".equals(m)
                || "归档后延时30天删除".equals(m)
                || (m.startsWith("归档后延时") && m.endsWith("删除"));
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
