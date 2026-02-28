package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.SystemConfigService;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final SystemConfigService systemConfigService;
    private final UserRepository userRepository;

    public ConfigController(SystemConfigService systemConfigService, UserRepository userRepository) {
        this.systemConfigService = systemConfigService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ApiResponse<SystemConfig> getConfig() {
        return ApiResponse.ok(systemConfigService.getConfig());
    }

    @GetMapping("/admin-contacts")
    public ApiResponse<List<Map<String, Object>>> getAdminContacts() {
        List<User> admins = userRepository.findAdminContacts(List.of("SUPER_ADMIN", "ADMIN"));
        List<Map<String, Object>> data = admins.stream().map(u -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", u.getId());
            item.put("name", (u.getRealName() != null && !u.getRealName().isBlank()) ? u.getRealName() : u.getUsername());
            item.put("username", u.getUsername());
            item.put("phone", u.getPhone());
            item.put("role", u.getRole());
            item.put("region", u.getRegion());
            item.put("enabled", u.isEnabled());
            return item;
        }).toList();
        return ApiResponse.ok(data);
    }
}
