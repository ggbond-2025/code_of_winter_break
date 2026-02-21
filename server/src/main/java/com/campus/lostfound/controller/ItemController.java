package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.service.ItemService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/items")
@Validated
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @PostMapping
    public ApiResponse<LostItem> create(@RequestBody CreateItemRequest req, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        LostItem item = itemService.create(userId, req.title(), req.description(), req.category(),
                req.location(), req.lostTime(), req.type(),
                req.contactName(), req.contactPhone(),
                req.features(), req.imageUrls(), req.reward(), req.storageLocation());
        return ApiResponse.ok(item);
    }

    @GetMapping
    public ApiResponse<Page<LostItem>> list(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String type,
            @RequestParam(defaultValue = "") String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        return ApiResponse.ok(itemService.publicList(keyword, status, category, type, location, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<LostItem> detail(@PathVariable Long id) {
        return ApiResponse.ok(itemService.getById(id));
    }

    @GetMapping("/my")
    public ApiResponse<Page<LostItem>> myItems(
            HttpServletRequest servletRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        return ApiResponse.ok(itemService.myItems(userId, page, size));
    }

    @PutMapping("/{id}")
    public ApiResponse<LostItem> update(@PathVariable Long id, @RequestBody UpdateItemRequest req, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        LostItem item = itemService.update(userId, id, req.title(), req.description(), req.category(),
                req.location(), req.lostTime(), req.features(), req.contactName(), req.contactPhone(),
                req.imageUrls(), req.reward(), req.storageLocation());
        return ApiResponse.ok(item);
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(@PathVariable Long id, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        itemService.cancel(userId, id);
        return ApiResponse.ok("已取消", null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, HttpServletRequest servletRequest) {
        Long userId = (Long) servletRequest.getAttribute("loginUserId");
        itemService.deleteByUser(userId, id);
        return ApiResponse.ok("已删除", null);
    }

    public record CreateItemRequest(
            @NotBlank(message = "标题不能为空") String title,
            @NotBlank(message = "描述不能为空") String description,
            @NotBlank(message = "分类不能为空") String category,
            @NotBlank(message = "地点不能为空") String location,
            String lostTime, String type,
            String contactName, String contactPhone,
            String features, String imageUrls, Double reward,
            String storageLocation
    ) {}

    public record UpdateItemRequest(
            String title, String description, String category, String location,
            String lostTime, String features, String contactName, String contactPhone,
            String imageUrls, Double reward, String storageLocation
    ) {}
}
