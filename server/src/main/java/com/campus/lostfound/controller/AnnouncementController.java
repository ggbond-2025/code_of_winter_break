package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.Announcement;
import com.campus.lostfound.repository.AnnouncementRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;

    public AnnouncementController(AnnouncementRepository announcementRepository) {
        this.announcementRepository = announcementRepository;
    }

    @GetMapping
    public ApiResponse<List<Announcement>> active(
            @RequestParam(defaultValue = "") String scope,
            @RequestParam(defaultValue = "") String region
    ) {
        String s = scope == null ? "" : scope.trim().toUpperCase();
        String r = region == null ? "" : region.trim();
        if (s.isEmpty()) {
            return ApiResponse.ok(announcementRepository.findActiveApproved());
        }
        if ("GLOBAL".equals(s)) {
            return ApiResponse.ok(announcementRepository.findActiveGlobal("GLOBAL"));
        }
        if ("REGION".equals(s)) {
            if (r.isEmpty()) {
                return ApiResponse.ok(announcementRepository.findActiveApprovedByScope("REGION"));
            }
            return ApiResponse.ok(announcementRepository.findActiveApprovedByScopeAndRegion("REGION", r));
        }
        return ApiResponse.ok(announcementRepository.findActiveApproved());
    }
}
