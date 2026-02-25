package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.SystemNotification;
import com.campus.lostfound.service.SystemNotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class SystemNotificationController {

    private final SystemNotificationService systemNotificationService;

    public SystemNotificationController(SystemNotificationService systemNotificationService) {
        this.systemNotificationService = systemNotificationService;
    }

    @GetMapping
    public ApiResponse<Page<SystemNotification>> myNotifications(
            HttpServletRequest servletRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        String role = (String) servletRequest.getAttribute("loginUserRole");
        if (userId == null) throw new IllegalArgumentException("请先登录");
        if ("SUPER_ADMIN".equals(role)) throw new IllegalArgumentException("系统管理员无需查看");
        return ApiResponse.ok(systemNotificationService.listForUser(userId, page, size));
    }
}
