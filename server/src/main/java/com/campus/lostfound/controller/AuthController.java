package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.User;
import com.campus.lostfound.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@RequestBody RegisterRequest req) {
        User user = authService.register(req.username(), req.password(), req.realName(), req.phone(), req.idCard());
        return ApiResponse.ok(Map.of("userId", user.getId(), "username", user.getUsername()));
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody LoginRequest req) {
        return ApiResponse.ok(authService.login(req.username(), req.password()));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@RequestBody ChangePasswordRequest req, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        authService.changePassword(userId, req.oldPassword(), req.newPassword());
        return ApiResponse.ok("密码修改成功", null);
    }

    @GetMapping("/me")
    public ApiResponse<User> me(HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        return ApiResponse.ok(authService.getUserById(userId));
    }

    public record RegisterRequest(
            @NotBlank(message = "用户名不能为空") @Size(min = 3, max = 20) String username,
            @NotBlank(message = "密码不能为空") @Size(min = 6, max = 20) String password,
            String realName, String phone, String idCard
    ) {}

    public record LoginRequest(
            @NotBlank(message = "用户名不能为空") String username,
            @NotBlank(message = "密码不能为空") String password
    ) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "原密码不能为空") String oldPassword,
            @NotBlank(message = "新密码不能为空") @Size(min = 6, max = 20) String newPassword
    ) {}
}
