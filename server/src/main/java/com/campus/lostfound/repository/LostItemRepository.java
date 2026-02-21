package com.campus.lostfound.repository;

import com.campus.lostfound.model.LostItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface LostItemRepository extends JpaRepository<LostItem, Long> {

    @Query("SELECT i FROM LostItem i WHERE " +
           "(:keyword = '' OR i.title LIKE %:keyword% OR i.description LIKE %:keyword%) AND " +
           "(:status = '' OR i.status = :status) AND " +
           "(:category = '' OR i.category = :category) AND " +
           "(:type = '' OR i.type = :type) AND " +
           "(:location = '' OR i.location LIKE %:location%) " +
           "ORDER BY i.createdAt DESC")
    Page<LostItem> search(@Param("keyword") String keyword,
                          @Param("status") String status,
                          @Param("category") String category,
                          @Param("type") String type,
                          @Param("location") String location,
                          Pageable pageable);

    @Query("SELECT i FROM LostItem i WHERE " +
           "(:keyword = '' OR i.title LIKE %:keyword% OR i.description LIKE %:keyword%) AND " +
           "i.status IN :statuses AND " +
           "(:category = '' OR i.category = :category) AND " +
           "(:type = '' OR i.type = :type) AND " +
           "(:location = '' OR i.location LIKE %:location%) " +
           "ORDER BY i.createdAt DESC")
    Page<LostItem> searchByStatuses(@Param("keyword") String keyword,
                                    @Param("statuses") List<String> statuses,
                                    @Param("category") String category,
                                    @Param("type") String type,
                                    @Param("location") String location,
                                    Pageable pageable);

    @Query("SELECT i FROM LostItem i WHERE " +
           "(:keyword = '' OR i.title LIKE %:keyword% OR i.description LIKE %:keyword%) AND " +
           "(:status = '' OR i.status = :status) AND " +
           "(:category = '' OR i.category = :category) AND " +
           "(:type = '' OR i.type = :type) AND " +
           "(:location = '' OR i.location LIKE %:location%) AND " +
           "(:since IS NULL OR i.createdAt >= :since) " +
           "ORDER BY i.createdAt DESC")
    Page<LostItem> searchWithTime(@Param("keyword") String keyword,
                                  @Param("status") String status,
                                  @Param("category") String category,
                                  @Param("type") String type,
                                  @Param("location") String location,
                                  @Param("since") LocalDateTime since,
                                  Pageable pageable);

    List<LostItem> findByStatusAndCreatedAtBefore(String status, LocalDateTime time);

    List<LostItem> findByStatusAndUpdatedAtBefore(String status, LocalDateTime time);

    Page<LostItem> findByCreatorIdOrderByCreatedAtDesc(Long creatorId, Pageable pageable);

    List<LostItem> findAllByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    LostItem findTopByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    long countByStatus(String status);

    long countByType(String type);
    
       @Query("SELECT COUNT(i) FROM LostItem i WHERE i.status IN :statuses AND (i.updatedAt < :time OR i.createdAt < :time)")
       long countExpiredForCleanup(@Param("statuses") List<String> statuses, @Param("time") LocalDateTime time);

       @Modifying
       @Query("DELETE FROM LostItem i WHERE i.status IN :statuses AND (i.updatedAt < :time OR i.createdAt < :time)")
       int deleteExpiredForCleanup(@Param("statuses") List<String> statuses, @Param("time") LocalDateTime time);
}
