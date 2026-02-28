package com.campus.lostfound.repository;

import com.campus.lostfound.model.ComplaintRecord;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComplaintRecordRepository extends JpaRepository<ComplaintRecord, Long> {
    Page<ComplaintRecord> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<ComplaintRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByTargetId(Long targetId);
    boolean existsByReporterIdAndComplaintTypeAndItemIdAndStatusNot(Long reporterId, String complaintType, Long itemId, String status);
    boolean existsByReporterIdAndComplaintTypeAndClaimIdAndStatusNot(Long reporterId, String complaintType, Long claimId, String status);
    boolean existsByReporterIdAndComplaintTypeAndChatMessageIdAndStatusNot(Long reporterId, String complaintType, Long chatMessageId, String status);
    ComplaintRecord findTopByReporterIdAndComplaintTypeAndItemIdOrderByCreatedAtDesc(Long reporterId, String complaintType, Long itemId);
    ComplaintRecord findTopByReporterIdAndComplaintTypeAndClaimIdOrderByCreatedAtDesc(Long reporterId, String complaintType, Long claimId);
    ComplaintRecord findTopByReporterIdAndComplaintTypeAndChatMessageIdOrderByCreatedAtDesc(Long reporterId, String complaintType, Long chatMessageId);
    long countByItemId(Long itemId);
    @Modifying
    @Query("update ComplaintRecord c set c.item = null where c.item is not null and c.item.id = :itemId")
    int clearItemReferenceByItemId(@Param("itemId") Long itemId);
    @Modifying
    @Query("update ComplaintRecord c set c.claim = null where c.claim is not null and c.claim.id in :claimIds")
    int clearClaimReferenceByClaimIds(@Param("claimIds") java.util.Collection<Long> claimIds);
    @Modifying
    @Query("update ComplaintRecord c set c.chatMessage = null where c.chatMessage is not null and c.chatMessage.claim.id in :claimIds")
    int clearChatMessageReferenceByClaimIds(@Param("claimIds") java.util.Collection<Long> claimIds);
    boolean existsByComplaintTypeAndChatMessageClaimIdAndStatusIn(String complaintType, Long claimId, java.util.Collection<String> statuses);
        @Query("""
                        select count(c) > 0 from ComplaintRecord c
                        where c.complaintType = 'CHAT_MESSAGE'
                            and c.status = 'RESOLVED'
                            and c.claim is not null
                            and c.claim.id = :claimId
                            and c.reporter.id = :peerId
                            and c.target.id = :userId
                        """)
        boolean existsResolvedPeerChatComplaint(@Param("claimId") Long claimId,
                                                                                        @Param("peerId") Long peerId,
                                                                                        @Param("userId") Long userId);
}
