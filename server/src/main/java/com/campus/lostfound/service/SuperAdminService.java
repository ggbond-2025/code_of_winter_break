package com.campus.lostfound.service;

import com.campus.lostfound.model.Announcement;
import com.campus.lostfound.model.User;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface SuperAdminService {

    Page<User> listUsers(String keyword, String role, int page, int size);

    User createAdmin(String username, String password, String realName, String phone, String region);

    User toggleUser(Long userId);

    void resetPassword(Long userId);

    List<Announcement> allAnnouncements();

    Announcement createAnnouncement(Long authorId, String title, String content);

    List<Announcement> pendingRegionAnnouncements();

    Announcement approveRegionAnnouncement(Long announcementId);

    Announcement rejectRegionAnnouncement(Long announcementId);

    Announcement toggleAnnouncement(Long announcementId);

    void deleteAnnouncement(Long announcementId);

    Map<String, Object> globalStats();
}
