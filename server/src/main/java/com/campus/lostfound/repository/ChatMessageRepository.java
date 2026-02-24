package com.campus.lostfound.repository;

import com.campus.lostfound.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
        @Query("""
                        select m from ChatMessage m
                        where m.claim.id = :claimId
                            and ((m.sender.id = :userId and m.receiver.id = :peerId)
                                or (m.sender.id = :peerId and m.receiver.id = :userId))
                        order by m.createdAt asc
                        """)
        List<ChatMessage> findDirectMessagesByClaimAndUsers(@Param("claimId") Long claimId,
                                                                                                                @Param("userId") Long userId,
                                                                                                                @Param("peerId") Long peerId);
        void deleteByClaimIdIn(java.util.Collection<Long> claimIds);
}
