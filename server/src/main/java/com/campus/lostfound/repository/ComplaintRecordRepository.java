package com.campus.lostfound.repository;

import com.campus.lostfound.model.ComplaintRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintRecordRepository extends JpaRepository<ComplaintRecord, Long> {
    Page<ComplaintRecord> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<ComplaintRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByTargetId(Long targetId);
}
