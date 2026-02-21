package com.campus.lostfound.service;

import com.campus.lostfound.model.SystemNotification;

import java.util.List;

public interface SystemNotificationService {
    SystemNotification send(Long senderId, Long targetUserId, String scope, String content);
    List<SystemNotification> listForUser(Long userId);
}
