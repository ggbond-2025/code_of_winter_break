package com.campus.lostfound.repository;

import com.campus.lostfound.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    @Query("SELECT u FROM User u WHERE " +
           "(:keyword = '' OR u.username LIKE %:keyword% OR u.realName LIKE %:keyword%) AND " +
           "(:role = '' OR u.role = :role) " +
           "ORDER BY u.createdAt DESC")
    Page<User> search(@Param("keyword") String keyword,
                      @Param("role") String role,
                      Pageable pageable);

    long countByRole(String role);

    @Query("SELECT u FROM User u WHERE u.role IN :roles AND u.phone IS NOT NULL AND u.phone <> '' ORDER BY u.role DESC, u.region ASC, u.username ASC")
    List<User> findAdminContacts(@Param("roles") Collection<String> roles);
}
