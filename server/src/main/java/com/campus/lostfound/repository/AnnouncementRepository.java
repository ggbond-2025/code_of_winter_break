package com.campus.lostfound.repository;

import com.campus.lostfound.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    @Query("SELECT a FROM Announcement a WHERE a.active = true AND (a.status = 'APPROVED' OR a.status IS NULL) ORDER BY a.createdAt DESC")
    List<Announcement> findActiveApproved();

    @Query("SELECT a FROM Announcement a WHERE a.active = true AND (a.scope = :scope OR a.scope IS NULL) AND (a.status = 'APPROVED' OR a.status IS NULL) ORDER BY a.createdAt DESC")
    List<Announcement> findActiveGlobal(@Param("scope") String scope);

    @Query("SELECT a FROM Announcement a WHERE a.active = true AND a.scope = :scope AND (a.status = 'APPROVED' OR a.status IS NULL) ORDER BY a.createdAt DESC")
    List<Announcement> findActiveApprovedByScope(@Param("scope") String scope);

    @Query("SELECT a FROM Announcement a WHERE a.active = true AND a.scope = :scope AND a.region = :region AND (a.status = 'APPROVED' OR a.status IS NULL) ORDER BY a.createdAt DESC")
    List<Announcement> findActiveApprovedByScopeAndRegion(@Param("scope") String scope, @Param("region") String region);

    List<Announcement> findByScopeAndStatusOrderByCreatedAtDesc(String scope, String status);
}
