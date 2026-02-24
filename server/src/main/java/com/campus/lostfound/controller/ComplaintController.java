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
        return ApiResponse.ok(complaintService.create(userId, req.targetType(), req.itemId(), req.claimId(), req.messageId(), req.reason(), req.detail()));
    }

    @GetMapping("/chat/reported")
    public ApiResponse<Boolean> hasChatReported(@RequestParam Long claimId,
                                                @RequestParam Long peerId,
                                                HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        if (userId == null) throw new IllegalArgumentException("请先登录");
        return ApiResponse.ok(complaintService.hasChatReported(userId, claimId, peerId));
    }

    public record CreateComplaintRequest(String targetType, Long itemId, Long claimId, Long messageId, @NotBlank String reason, String detail) {}
}
