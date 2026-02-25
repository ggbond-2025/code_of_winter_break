package com.campus.lostfound.service;

import com.campus.lostfound.model.LostItem;
import org.springframework.data.domain.Page;

public interface ItemService {

    LostItem create(Long userId, String title, String description, String category,
                    String location, String lostTime, String type,
                    String contactName, String contactPhone,
                    String features, String imageUrls, Double reward, String storageLocation);

    Page<LostItem> publicList(String keyword, String status, String category, String type, String location, int page, int size);

    LostItem getById(Long id);

    Page<LostItem> myItems(Long userId, int page, int size);

    LostItem update(Long userId, Long itemId, String title, String description, String category,
                    String location, String lostTime, String features, String contactName, String contactPhone,
                    String imageUrls, Double reward, String storageLocation);

    void cancel(Long userId, Long itemId);

    LostItem republish(Long userId, Long itemId);

    void deleteByUser(Long userId, Long itemId);
}
