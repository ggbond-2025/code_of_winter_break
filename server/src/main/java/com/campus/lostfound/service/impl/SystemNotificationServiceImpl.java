package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.SystemNotification;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.SystemNotificationRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.SystemNotificationService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SystemNotificationServiceImpl implements SystemNotificationService {

    private final SystemNotificationRepository systemNotificationRepository;
    private final UserRepository userRepository;

    public SystemNotificationServiceImpl(SystemNotificationRepository systemNotificationRepository,
                                         UserRepository userRepository) {
        this.systemNotificationRepository = systemNotificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public SystemNotification send(Long senderId, Long targetUserId, String scope, String content) {
        String c = content == null ? "" : content.trim();
        if (c.isEmpty()) {
            throw new IllegalArgumentException("通知内容不能为空");
        }
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        SystemNotification n = new SystemNotification();
        n.setSender(sender);
        String s = scope == null ? "" : scope.trim().toUpperCase();
        if ("ALL".equals(s) || targetUserId == null) {
            n.setScope("ALL");
            n.setTarget(null);
        } else {
            User target = userRepository.findById(targetUserId)
                    .orElseThrow(() -> new IllegalArgumentException("目标用户不存在"));
            n.setScope("USER");
            n.setTarget(target);
        }
        n.setContent(c);
        return systemNotificationRepository.save(n);
    }

    @Override
    public List<SystemNotification> listForUser(Long userId) {
        return systemNotificationRepository.findForUser(userId);
    }
}
