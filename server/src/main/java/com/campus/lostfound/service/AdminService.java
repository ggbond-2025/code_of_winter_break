package com.campus.lostfound.service;

import com.campus.lostfound.model.LostItem;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface AdminService {

    Page<LostItem> allItems(String keyword, String status, String category, String type, String location, Integer days, int page, int size);

    LostItem approve(Long itemId);

    LostItem reject(Long itemId, String reason);

    LostItem archive(Long itemId, String method, String archiveLocation, String archiveImageUrls);

    LostItem deleteItem(Long itemId, String reason);

    LostItem updateInfo(Long itemId, String storageLocation, String contactName, String contactPhone);

    LostItem updateItemStatus(Long itemId, String status);

    Map<String, Object> stats();

    List<LostItem> historyItems(String keyword, String type, String location, Integer days);

    LostItem updateItem(Long itemId, String title, String description, String category, String location,
                        String lostTime, String features, String contactName, String contactPhone,
                        String imageUrls, Double reward, String storageLocation);

    Map<String, Object> statsOverview();
}
