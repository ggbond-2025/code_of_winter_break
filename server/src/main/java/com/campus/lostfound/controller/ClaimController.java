package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.ChatMessage;
import com.campus.lostfound.model.ClaimRecord;
import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.service.ClaimService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping
    public ApiResponse<ClaimCreateResult> create(@Valid @RequestBody CreateClaimRequest req, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        if (userId == null) throw new IllegalArgumentException("请先登录");
        ClaimRecord record = claimService.create(userId, req.itemId(), req.message(), req.proof(), req.imageUrls());
        return ApiResponse.ok(new ClaimCreateResult(record.getId(), record.getStatus()));
    }

    @GetMapping("/my")
    public ApiResponse<Page<MyClaimProgress>> myClaims(
            HttpServletRequest servletRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        List<ClaimRecord> claims = claimService.myClaims(userId);
        List<MyClaimProgress> mapped = claims.stream()
                .map(c -> new MyClaimProgress(c.getId(), c.getStatus(), c.getItem() != null ? c.getItem().getStatus() : c.getStatus(), c.getItem()))
                .collect(Collectors.toList());
        int from = Math.min(page * size, mapped.size());
        int to = Math.min(from + size, mapped.size());
        Page<MyClaimProgress> res = new PageImpl<>(mapped.subList(from, to), PageRequest.of(page, size), mapped.size());
        return ApiResponse.ok(res);
    }

    @GetMapping("/my/applications")
    public ApiResponse<Page<ClaimRecord>> myApplications(
            HttpServletRequest servletRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        if (userId == null) throw new IllegalArgumentException("请先登录");
        List<ClaimRecord> claims = claimService.myClaims(userId);
        int from = Math.min(page * size, claims.size());
        int to = Math.min(from + size, claims.size());
        Page<ClaimRecord> res = new PageImpl<>(claims.subList(from, to), PageRequest.of(page, size), claims.size());
        return ApiResponse.ok(res);
    }

    @GetMapping("/my/item/{itemId}")
    public ApiResponse<ClaimRecord> myClaimForItem(@PathVariable Long itemId, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        if (userId == null) throw new IllegalArgumentException("请先登录");
        return ApiResponse.ok(claimService.getMyClaimForItem(userId, itemId));
    }

    @GetMapping("/item/{itemId}")
    public ApiResponse<List<ClaimRecord>> claimsForItem(@PathVariable Long itemId, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        String role = (String) servletRequest.getAttribute("loginUserRole");
        return ApiResponse.ok(claimService.claimsForItem(userId, role, itemId));
    }

    @PutMapping("/{id}/review")
    public ApiResponse<ClaimRecord> review(@PathVariable Long id, @RequestBody ReviewRequest req, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        String role = (String) servletRequest.getAttribute("loginUserRole");
        return ApiResponse.ok(claimService.review(userId, role, id, req.status(), req.reason()));
    }

    @GetMapping("/chats")
    public ApiResponse<Page<ChatGroup>> myChats(
            HttpServletRequest servletRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        List<ClaimRecord> claims = claimService.myMatchedChats(userId);
        Map<Long, ChatGroup> grouped = new LinkedHashMap<>();
        for (ClaimRecord claim : claims) {
            LostItem item = claim.getItem();
            ChatGroup group = grouped.get(item.getId());
            if (group == null) {
                group = new ChatGroup(item, new ArrayList<>());
                grouped.put(item.getId(), group);
            }
            group.claims().add(claim);
        }
        List<ChatGroup> groups = new ArrayList<>(grouped.values());
        int from = Math.min(page * size, groups.size());
        int to = Math.min(from + size, groups.size());
        Page<ChatGroup> res = new PageImpl<>(groups.subList(from, to), PageRequest.of(page, size), groups.size());
        return ApiResponse.ok(res);
    }

    @GetMapping("/{claimId}")
    public ApiResponse<ClaimRecord> getClaimDetail(@PathVariable Long claimId, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        return ApiResponse.ok(claimService.getClaimDetail(userId, claimId));
    }

    @PostMapping("/{claimId}/messages")
    public ApiResponse<ChatMessage> sendMessage(@PathVariable Long claimId, @RequestBody SendMessageRequest req, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        return ApiResponse.ok(claimService.sendMessage(userId, claimId, req.content()));
    }

    @GetMapping("/{claimId}/messages")
    public ApiResponse<List<ChatMessage>> getMessages(@PathVariable Long claimId, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        return ApiResponse.ok(claimService.getMessages(userId, claimId));
    }

    public record CreateClaimRequest(Long itemId, @NotBlank(message = "留言不能为空") String message, String proof, String imageUrls) {}
    public record ClaimCreateResult(Long id, String status) {}
    public record ReviewRequest(@NotBlank(message = "审核状态不能为空") String status, String reason) {}
    public record SendMessageRequest(@NotBlank(message = "消息不能为空") String content) {}
    public record ChatGroup(LostItem item, List<ClaimRecord> claims) {}
    public record MyClaimProgress(Long claimId, String claimStatus, String progressStatus, LostItem item) {}
}
