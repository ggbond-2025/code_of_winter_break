package com.campus.lostfound.service;

import com.campus.lostfound.model.SystemNotification;
import org.springframework.data.domain.Page;

public interface SystemNotificationService {
    SystemNotification send(Long senderId, Long targetUserId, String scope, String content);
    Page<SystemNotification> listForUser(Long userId, int page, int size);
}
