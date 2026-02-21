package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.ComplaintRecord;
import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.ComplaintRecordRepository;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.ComplaintService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRecordRepository complaintRecordRepository;
    private final LostItemRepository lostItemRepository;
    private final UserRepository userRepository;

    public ComplaintServiceImpl(ComplaintRecordRepository complaintRecordRepository,
                                LostItemRepository lostItemRepository,
                                UserRepository userRepository) {
        this.complaintRecordRepository = complaintRecordRepository;
        this.lostItemRepository = lostItemRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ComplaintRecord create(Long reporterId, Long itemId, String reason, String detail) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("消息不存在"));
        User target = item.getCreator();
        if (target == null) {
            throw new IllegalArgumentException("被投诉用户不存在");
        }
        ComplaintRecord record = new ComplaintRecord();
        record.setItem(item);
        record.setReporter(reporter);
        record.setTarget(target);
        record.setReason(reason);
        record.setDetail(detail);
        record.setStatus("PENDING");
        return complaintRecordRepository.save(record);
    }

    @Override
    public Page<ComplaintRecord> list(String status, int page, int size) {
        String s = status == null ? "" : status.trim();
        if (s.isEmpty() || "ALL".equalsIgnoreCase(s)) {
            return complaintRecordRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        }
        return complaintRecordRepository.findByStatusOrderByCreatedAtDesc(s.toUpperCase(), PageRequest.of(page, size));
    }

    @Override
    public ComplaintRecord resolve(Long handlerId, Long complaintId, String action) {
        ComplaintRecord record = complaintRecordRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("投诉记录不存在"));
        User handler = userRepository.findById(handlerId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        Long itemId = record.getItem() != null ? record.getItem().getId() : null;
        String act = action == null ? "" : action.trim();
        if (act.isEmpty()) {
            throw new IllegalArgumentException("处理方式不能为空");
        }
        if ("DELETE_ITEM".equals(act)) {
            record.setItem(null);
            complaintRecordRepository.save(record);
            if (itemId != null) lostItemRepository.deleteById(itemId);
        } else if ("BAN_USER".equals(act)) {
            User target = record.getTarget();
            target.setEnabled(false);
            userRepository.save(target);
        } else if ("DELETE_AND_BAN".equals(act)) {
            record.setItem(null);
            complaintRecordRepository.save(record);
            if (itemId != null) lostItemRepository.deleteById(itemId);
            User target = record.getTarget();
            target.setEnabled(false);
            userRepository.save(target);
        } else if (!"WARN".equals(act)) {
            throw new IllegalArgumentException("处理方式不合法");
        }
        record.setStatus("RESOLVED");
        record.setAction(act);
        record.setHandler(handler);
        record.setHandledAt(LocalDateTime.now());
        return complaintRecordRepository.save(record);
    }

    @Override
    public ComplaintRecord reject(Long handlerId, Long complaintId) {
        ComplaintRecord record = complaintRecordRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("投诉记录不存在"));
        User handler = userRepository.findById(handlerId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        record.setStatus("REJECTED");
        record.setHandler(handler);
        record.setHandledAt(LocalDateTime.now());
        return complaintRecordRepository.save(record);
    }
}
