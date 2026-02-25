package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.Announcement;
import com.campus.lostfound.model.ClaimRecord;
import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.AnnouncementRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.AdminService;
import com.campus.lostfound.service.ClaimService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final ClaimService claimService;
    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    public AdminController(AdminService adminService, ClaimService claimService, AnnouncementRepository announcementRepository, UserRepository userRepository) {
        this.adminService = adminService;
        this.claimService = claimService;
        this.announcementRepository = announcementRepository;
        this.userRepository = userRepository;
    }

    private void requireAdmin(HttpServletRequest req) {
        String role = (String) req.getAttribute("loginUserRole");
        if (!"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role))
            throw new IllegalArgumentException("需要管理员权限");
    }

    @GetMapping("/items")
    public ApiResponse<Page<LostItem>> allItems(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String type,
            @RequestParam(defaultValue = "") String location,
            @RequestParam(required = false) Integer time,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            HttpServletRequest servletRequest
    ) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(adminService.allItems(keyword, status, category, type, location, time, page, size));
    }

    @PutMapping("/items/{id}/approve")
    public ApiResponse<LostItem> approve(@PathVariable Long id, HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(adminService.approve(id));
    }

    @PutMapping("/items/{id}/reject")
    public ApiResponse<LostItem> reject(@PathVariable Long id, @RequestBody RejectRequest req, HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(adminService.reject(id, req.reason()));
    }

    @PutMapping("/items/{id}/archive")
    public ApiResponse<LostItem> archive(@PathVariable Long id, @RequestBody ArchiveRequest req, HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        if (req == null) throw new IllegalArgumentException("请求参数不能为空");
        return ApiResponse.ok(adminService.archive(id, req.method(), req.location(), req.imageUrls()));
    }

    @PostMapping("/announcements/region")
    public ApiResponse<Announcement> createRegionAnnouncement(@RequestBody AnnouncementRequest req, HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        User author = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        String region = req.region();
        if (region == null || region.trim().isEmpty()) {
            throw new IllegalArgumentException("请选择发送地区");
        }
        if (!List.of("朝晖校区", "屏峰校区", "莫干山校区").contains(region.trim())) {
            throw new IllegalArgumentException("发送地区不合法");
        }
        Announcement a = new Announcement();
        a.setTitle(req.title());
        a.setContent(req.content());
        a.setAuthor(author);
        a.setScope("REGION");
        a.setRegion(region.trim());
        a.setStatus("PENDING");
        a.setActive(false);
        return ApiResponse.ok(announcementRepository.save(a));
    }

    @DeleteMapping("/items/{id}")
    public ApiResponse<LostItem> deleteItem(@PathVariable Long id, @RequestBody DeleteRequest req, HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(adminService.deleteItem(id, req.reason()));
    }

    @PutMapping("/items/{id}/info")
    public ApiResponse<LostItem> updateInfo(@PathVariable Long id, @RequestBody UpdateInfoRequest req, HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(adminService.updateInfo(id, req.storageLocation(), req.contactName(), req.contactPhone()));
    }

    @PutMapping("/items/{id}")
    public ApiResponse<LostItem> updateItem(@PathVariable Long id, @RequestBody UpdateItemRequest req, HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(adminService.updateItem(id, req.title(), req.description(), req.category(), req.location(),
                req.lostTime(), req.features(), req.contactName(), req.contactPhone(), req.imageUrls(), req.reward(), req.storageLocation()));
    }

    @PutMapping("/items/{id}/status")
    public ApiResponse<LostItem> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest req, HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(adminService.updateItemStatus(id, req.status()));
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> stats(HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(adminService.stats());
    }

    @GetMapping("/stats/overview")
    public ApiResponse<Map<String, Object>> statsOverview(HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(adminService.statsOverview());
    }

    @GetMapping("/claims/pending")
    public ApiResponse<List<ClaimRecord>> pendingClaims(HttpServletRequest servletRequest) {
        requireAdmin(servletRequest);
        return ApiResponse.ok(claimService.listPendingClaims());
    }

    @GetMapping("/reviews/history")
    public ApiResponse<Page<ReviewRecord>> reviewHistory(
            @RequestParam(defaultValue = "") String type,
            @RequestParam(defaultValue = "") String location,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) Integer time,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            HttpServletRequest servletRequest
    ) {
        requireAdmin(servletRequest);
        String t = type == null ? "" : type.trim().toUpperCase();
        List<ReviewRecord> records = new ArrayList<>();

        if (!"CLAIM".equals(t)) {
            List<LostItem> items = adminService.historyItems(keyword, t, location, time);
            for (LostItem item : items) {
                String result = "REJECTED".equals(item.getStatus()) ? "REJECTED" : "APPROVED";
                records.add(new ReviewRecord(item.getType(), result, item, null, item.getUpdatedAt()));
            }
        }

        List<ClaimRecord> claims = claimService.adminHistoryClaims(location, keyword, time);
        for (ClaimRecord claim : claims) {
            if (!t.isEmpty() && !"CLAIM".equals(t)) {
                String itemType = claim.getItem() != null ? claim.getItem().getType() : "";
                if (!t.equalsIgnoreCase(itemType)) continue;
            }
            String result = claim.getReviewer() != null ? "APPROVED" : "REJECTED";
            records.add(new ReviewRecord("CLAIM", result, claim.getItem(), claim, claim.getUpdatedAt()));
        }

        records.sort((a, b) -> b.reviewTime().compareTo(a.reviewTime()));
        int from = Math.min(page * size, records.size());
        int to = Math.min(from + size, records.size());
        List<ReviewRecord> content = records.subList(from, to);
        Page<ReviewRecord> res = new PageImpl<>(content, PageRequest.of(page, size), records.size());
        return ApiResponse.ok(res);
    }

    public record RejectRequest(@NotBlank(message = "驳回原因不能为空") String reason) {}
    public record DeleteRequest(@NotBlank(message = "删除理由不能为空") String reason) {}
    public record UpdateInfoRequest(String storageLocation, String contactName, String contactPhone) {}
    public record UpdateStatusRequest(String status) {}
    public record ArchiveRequest(String method, String location, String imageUrls) {}
    public record AnnouncementRequest(@NotBlank String title, @NotBlank String content, String region) {}
    public record UpdateItemRequest(
            String title, String description, String category, String location,
            String lostTime, String features, String contactName, String contactPhone,
            String imageUrls, Double reward, String storageLocation
    ) {}
    public record ReviewRecord(String type, String result, LostItem item, ClaimRecord claim, LocalDateTime reviewTime) {}
}
