package com.campus.lostfound.repository;

import com.campus.lostfound.model.SystemNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SystemNotificationRepository extends JpaRepository<SystemNotification, Long> {
    @Query("SELECT n FROM SystemNotification n WHERE n.scope = 'ALL' OR (n.target IS NOT NULL AND n.target.id = :userId) ORDER BY n.createdAt DESC")
    List<SystemNotification> findForUser(@Param("userId") Long userId);
}
