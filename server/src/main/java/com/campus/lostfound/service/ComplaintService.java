package com.campus.lostfound.service;

import com.campus.lostfound.model.ComplaintRecord;
import org.springframework.data.domain.Page;

public interface ComplaintService {
    ComplaintRecord create(Long reporterId, Long itemId, String reason, String detail);
    Page<ComplaintRecord> list(String status, int page, int size);
    ComplaintRecord resolve(Long handlerId, Long complaintId, String action);
    ComplaintRecord reject(Long handlerId, Long complaintId);
}
