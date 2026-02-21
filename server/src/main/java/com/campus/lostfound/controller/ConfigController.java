package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.service.SystemConfigService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final SystemConfigService systemConfigService;

    public ConfigController(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @GetMapping
    public ApiResponse<SystemConfig> getConfig() {
        return ApiResponse.ok(systemConfigService.getConfig());
    }
}
