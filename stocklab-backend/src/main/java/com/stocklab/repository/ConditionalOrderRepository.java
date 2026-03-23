package com.stocklab.repository;

import com.stocklab.model.ConditionalOrder;
import com.stocklab.model.ConditionalOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConditionalOrderRepository extends JpaRepository<ConditionalOrder, Long> {

    // Lấy lệnh điều kiện của user (có pagination)
    Page<ConditionalOrder> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Lấy theo status
    Page<ConditionalOrder> findByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId, ConditionalOrderStatus status, Pageable pageable);

    // Lấy tất cả lệnh ACTIVE (cho scheduler check trigger)
    List<ConditionalOrder> findByStatus(ConditionalOrderStatus status);

    // Lấy lệnh ACTIVE đã hết hạn
    List<ConditionalOrder> findByStatusAndExpiryDateBefore(
            ConditionalOrderStatus status, LocalDateTime now);
}
