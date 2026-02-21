package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.Announcement;
import com.campus.lostfound.model.ComplaintRecord;
import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.model.SystemNotification;
import com.campus.lostfound.model.User;
import com.campus.lostfound.service.ComplaintService;
import com.campus.lostfound.service.SuperAdminService;
import com.campus.lostfound.service.SystemConfigService;
import com.campus.lostfound.service.SystemNotificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/super")
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final ComplaintService complaintService;
    private final SystemNotificationService systemNotificationService;
    private final SystemConfigService systemConfigService;

    public SuperAdminController(SuperAdminService superAdminService, ComplaintService complaintService, SystemNotificationService systemNotificationService, SystemConfigService systemConfigService) {
        this.superAdminService = superAdminService;
        this.complaintService = complaintService;
        this.systemNotificationService = systemNotificationService;
        this.systemConfigService = systemConfigService;
    }

    private void requireSuperAdmin(HttpServletRequest req) {
        String role = (String) req.getAttribute("loginUserRole");
        if (!"SUPER_ADMIN".equals(role))
            throw new IllegalArgumentException("需要系统管理员权限");
    }

    @GetMapping("/users")
    public ApiResponse<Page<User>> listUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest servletRequest
    ) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(superAdminService.listUsers(keyword, role, page, size));
    }

    @PostMapping("/users")
    public ApiResponse<User> createAdmin(@RequestBody CreateAdminRequest req, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(superAdminService.createAdmin(req.username(), req.password(), req.realName(), req.phone(), req.region()));
    }

    @PutMapping("/users/{id}/toggle")
    public ApiResponse<User> toggleUser(@PathVariable Long id, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(superAdminService.toggleUser(id));
    }

    @PutMapping("/users/{id}/reset-password")
    public ApiResponse<Void> resetPassword(@PathVariable Long id, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        superAdminService.resetPassword(id);
        return ApiResponse.ok("密码已重置为 123456", null);
    }

    @GetMapping("/announcements")
    public ApiResponse<List<Announcement>> allAnnouncements(HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(superAdminService.allAnnouncements());
    }

    @PostMapping("/announcements")
    public ApiResponse<Announcement> createAnnouncement(@RequestBody AnnouncementRequest req, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        return ApiResponse.ok(superAdminService.createAnnouncement(userId, req.title(), req.content()));
    }

    @GetMapping("/announcements/region/pending")
    public ApiResponse<List<Announcement>> pendingRegionAnnouncements(HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(superAdminService.pendingRegionAnnouncements());
    }

    @PutMapping("/announcements/{id}/approve")
    public ApiResponse<Announcement> approveRegionAnnouncement(@PathVariable Long id, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(superAdminService.approveRegionAnnouncement(id));
    }

    @PutMapping("/announcements/{id}/reject")
    public ApiResponse<Announcement> rejectRegionAnnouncement(@PathVariable Long id, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(superAdminService.rejectRegionAnnouncement(id));
    }

    @PutMapping("/announcements/{id}/toggle")
    public ApiResponse<Announcement> toggleAnnouncement(@PathVariable Long id, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(superAdminService.toggleAnnouncement(id));
    }

    @DeleteMapping("/announcements/{id}")
    public ApiResponse<Void> deleteAnnouncement(@PathVariable Long id, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        superAdminService.deleteAnnouncement(id);
        return ApiResponse.ok("已删除", null);
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> globalStats(HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(superAdminService.globalStats());
    }

    @GetMapping("/config")
    public ApiResponse<SystemConfig> getConfig(HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(systemConfigService.getConfig());
    }

    @PutMapping("/config")
    public ApiResponse<SystemConfig> updateConfig(@RequestBody SystemConfig update, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(systemConfigService.updateConfig(update));
    }

    @PostMapping("/notifications")
    public ApiResponse<SystemNotification> sendNotification(@RequestBody SendNotificationRequest req, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        return ApiResponse.ok(systemNotificationService.send(userId, req.targetUserId(), req.scope(), req.content()));
    }

    @GetMapping("/complaints")
    public ApiResponse<Page<ComplaintRecord>> listComplaints(
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            HttpServletRequest servletRequest
    ) {
        requireSuperAdmin(servletRequest);
        return ApiResponse.ok(complaintService.list(status, page, size));
    }

    @PutMapping("/complaints/{id}/resolve")
    public ApiResponse<ComplaintRecord> resolveComplaint(
            @PathVariable Long id,
            @RequestBody ResolveComplaintRequest req,
            HttpServletRequest servletRequest
    ) {
        requireSuperAdmin(servletRequest);
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        return ApiResponse.ok(complaintService.resolve(userId, id, req.action()));
    }

    @PutMapping("/complaints/{id}/reject")
    public ApiResponse<ComplaintRecord> rejectComplaint(@PathVariable Long id, HttpServletRequest servletRequest) {
        requireSuperAdmin(servletRequest);
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        return ApiResponse.ok(complaintService.reject(userId, id));
    }

    public record CreateAdminRequest(@NotBlank String username, @NotBlank String password, String realName, String phone, String region) {}
    public record AnnouncementRequest(@NotBlank String title, @NotBlank String content) {}
    public record ResolveComplaintRequest(@NotBlank String action) {}
    public record SendNotificationRequest(Long targetUserId, String scope, @NotBlank String content) {}
}
