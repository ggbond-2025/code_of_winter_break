package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.repository.ClaimRecordRepository;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.service.AdminService;
import com.campus.lostfound.service.SystemConfigService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

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
    private final SystemConfigService systemConfigService;

    public AdminServiceImpl(LostItemRepository lostItemRepository, ClaimRecordRepository claimRecordRepository, SystemConfigService systemConfigService) {
        this.lostItemRepository = lostItemRepository;
        this.claimRecordRepository = claimRecordRepository;
        this.systemConfigService = systemConfigService;
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
        item.setStatus("APPROVED");
        item.setRejectReason(null);
        return lostItemRepository.save(item);
    }

    @Override
    public LostItem reject(Long itemId, String reason) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        item.setStatus("REJECTED");
        item.setRejectReason(reason);
        return lostItemRepository.save(item);
    }

    @Override
    public LostItem archive(Long itemId, String method) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        item.setStatus("ARCHIVED");
        String m = method == null ? "" : method.trim();
        if (m.isEmpty()) m = "仅设置归档";
        item.setArchiveMethod(m);
        if ("归档后删除".equals(m)) {
            lostItemRepository.delete(item);
            return item;
        }
        return lostItemRepository.save(item);
    }

    @Override
    public LostItem deleteItem(Long itemId, String reason) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        String r = reason == null ? "" : reason.trim();
        if (r.isEmpty()) {
            throw new IllegalArgumentException("删除理由不能为空");
        }
        item.setStatus("ADMIN_DELETED");
        item.setRejectReason(r);
        return lostItemRepository.save(item);
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
        if ("CANCELLED".equals(item.getStatus())) {
            throw new IllegalArgumentException("已取消的物品无法修改状态");
        }
        String s = status == null ? "" : status.toUpperCase();
        if (!java.util.Set.of("APPROVED", "MATCHED", "CLAIMED").contains(s)) {
            throw new IllegalArgumentException("无效的状态");
        }
        item.setStatus(s);
        return lostItemRepository.save(item);
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
        List<LostItem> candidates = lostItemRepository.findByStatusAndCreatedAtBefore("APPROVED", threshold);
        for (LostItem item : candidates) {
            long claimCount = claimRecordRepository.countByItemId(item.getId());
            if (claimCount > 0) continue;
            item.setStatus("ARCHIVED");
            item.setArchiveMethod("仅设置归档");
            lostItemRepository.save(item);
        }
    }

    @Scheduled(cron = "0 30 2 * * *")
    public void autoDeleteArchivedItems() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        List<LostItem> archived = lostItemRepository.findByStatusAndUpdatedAtBefore("ARCHIVED", threshold);
        for (LostItem item : archived) {
            if (!"归档后延时30天删除".equals(item.getArchiveMethod())) continue;
            lostItemRepository.delete(item);
        }
    }
}
