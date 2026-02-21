package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.repository.SystemConfigRepository;
import com.campus.lostfound.service.SystemConfigService;
import org.springframework.stereotype.Service;

@Service
public class SystemConfigServiceImpl implements SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;

    public SystemConfigServiceImpl(SystemConfigRepository systemConfigRepository) {
        this.systemConfigRepository = systemConfigRepository;
    }

    @Override
    public SystemConfig getConfig() {
        return systemConfigRepository.findById(1L).orElseGet(() -> {
            SystemConfig cfg = new SystemConfig();
            cfg.setCategories("证件,电子产品,生活用品,文体,书籍,其他");
            return systemConfigRepository.save(cfg);
        });
    }

    @Override
    public SystemConfig updateConfig(SystemConfig update) {
        SystemConfig cfg = getConfig();
        if (update.getCategories() != null) cfg.setCategories(normalizeCategories(update.getCategories()));
        if (update.getClaimExpireDays() != null && update.getClaimExpireDays() > 0) cfg.setClaimExpireDays(update.getClaimExpireDays());
        if (update.getPublishCooldownMinutes() != null && update.getPublishCooldownMinutes() >= 0) cfg.setPublishCooldownMinutes(update.getPublishCooldownMinutes());
        cfg.setForbidWordCheck(update.isForbidWordCheck());
        cfg.setRequireImage(update.isRequireImage());
        cfg.setRequireLocationDetail(update.isRequireLocationDetail());
        cfg.setEnableReview(update.isEnableReview());
        cfg.setEnableDescLimit(update.isEnableDescLimit());
        if (update.getDescMaxLength() != null && update.getDescMaxLength() > 0) cfg.setDescMaxLength(update.getDescMaxLength());
        return systemConfigRepository.save(cfg);
    }

    private String normalizeCategories(String input) {
        String raw = input == null ? "" : input.trim();
        if (raw.isEmpty()) return "证件,电子产品,生活用品,文体,书籍,其他";
        return raw.replace("，", ",").replace("；", ",");
    }
}
