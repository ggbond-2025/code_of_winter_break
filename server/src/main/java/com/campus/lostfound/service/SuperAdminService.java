package com.campus.lostfound.service;

import com.campus.lostfound.model.Announcement;
import com.campus.lostfound.model.User;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface SuperAdminService {

    Page<User> listUsers(String keyword, String role, int page, int size);

    User createUser(String username, String password, String realName, String phone, String region, String role);

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

    Map<String, Object> latestBackupInfo();

    Map<String, Object> backupNow();

    Map<String, Object> exportDataCsv(Integer rangeMonths, List<String> types);

    Map<String, Object> previewExpiredCleanup(Integer days);

    Map<String, Object> cleanupExpiredData(Integer days);
}
