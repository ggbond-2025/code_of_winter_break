package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.repository.SystemConfigRepository;
import com.campus.lostfound.service.SystemConfigService;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Locale;

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
            cfg.setForbiddenWords("广告,代购,赌博,色情,诈骗");
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
        if (update.getForbiddenWords() != null) cfg.setForbiddenWords(normalizeForbiddenWords(update.getForbiddenWords()));
        cfg.setRequireImage(update.isRequireImage());
        cfg.setRequireLocationDetail(update.isRequireLocationDetail());
        cfg.setEnableReview(update.isEnableReview());
        cfg.setEnableDescLimit(update.isEnableDescLimit());
        if (update.getDescMaxLength() != null && update.getDescMaxLength() > 0) cfg.setDescMaxLength(update.getDescMaxLength());
        return systemConfigRepository.save(cfg);
    }

    @Override
    public boolean containsForbiddenWord(String content) {
        if (content == null || content.trim().isEmpty()) return false;
        SystemConfig cfg = getConfig();
        if (!cfg.isForbidWordCheck()) return false;
        String lowered = content.toLowerCase(Locale.ROOT);
        return parseForbiddenWords(cfg.getForbiddenWords()).stream().anyMatch(lowered::contains);
    }

    @Override
    public boolean containsForbiddenWord(Collection<String> contents) {
        if (contents == null || contents.isEmpty()) return false;
        String merged = String.join(" ", contents);
        return containsForbiddenWord(merged);
    }

    private String normalizeCategories(String input) {
        String raw = input == null ? "" : input.trim();
        if (raw.isEmpty()) return "证件,电子产品,生活用品,文体,书籍,其他";
        return raw.replace("，", ",").replace("；", ",");
    }

    private String normalizeForbiddenWords(String input) {
        List<String> words = parseForbiddenWords(input);
        if (words.isEmpty()) return "广告,代购,赌博,色情,诈骗";
        return String.join(",", words);
    }

    private List<String> parseForbiddenWords(String raw) {
        String text = raw == null ? "" : raw;
        return java.util.Arrays.stream(text.split("[,，;；\\s\\n\\r\\t]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toLowerCase(Locale.ROOT))
                .distinct()
                .toList();
    }
}
