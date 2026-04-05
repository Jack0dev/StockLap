package com.stocklab.repository;

import com.stocklab.model.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    List<Portfolio> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Portfolio p WHERE p.user.id = :userId AND p.stock.id = :stockId")
    Optional<Portfolio> findByUserIdAndStockId(@org.springframework.data.repository.query.Param("userId") Long userId, @org.springframework.data.repository.query.Param("stockId") Long stockId);

    Optional<Portfolio> findByUserIdAndStockTicker(Long userId, String ticker);

    void deleteByStockId(Long stockId);
}
