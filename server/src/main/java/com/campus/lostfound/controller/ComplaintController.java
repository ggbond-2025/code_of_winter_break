package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.ComplaintRecord;
import com.campus.lostfound.service.ComplaintService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ApiResponse<ComplaintRecord> create(@RequestBody CreateComplaintRequest req, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        if (userId == null) throw new IllegalArgumentException("请先登录");
        return ApiResponse.ok(complaintService.create(userId, req.itemId(), req.reason(), req.detail()));
    }

    public record CreateComplaintRequest(Long itemId, @NotBlank String reason, String detail) {}
}
