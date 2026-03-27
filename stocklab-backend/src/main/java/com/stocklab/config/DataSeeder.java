package com.stocklab.config;

import com.stocklab.model.Role;
import com.stocklab.model.Stock;
import com.stocklab.model.StockPriceHistory;
import com.stocklab.model.User;
import com.stocklab.model.Portfolio;
import com.stocklab.model.Watchlist;
import com.stocklab.repository.StockPriceHistoryRepository;
import com.stocklab.repository.StockRepository;
import com.stocklab.repository.UserRepository;
import com.stocklab.repository.PortfolioRepository;
import com.stocklab.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final StockRepository stockRepository;
    private final StockPriceHistoryRepository priceHistoryRepository;
    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final WatchlistRepository watchlistRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedAdminUser();
        unlockAllExistingUsers();

        seedUsers();
        unlockAllExistingUsers();
        seedStocks();
        unlockAllExistingStocks();
        seedPortfolios();
        seedWatchlists();
    }

    private void seedUsers() {
        // Check nếu đã có regular users (không đếm admin vì seedAdminUser chạy trước)
        if (userRepository.existsByUsername("user1")) {
            log.info("👤 Database đã có regular users, bỏ qua seeding user.");
            return;
        }

        log.info("🌱 Bắt đầu seed dữ liệu user...");

        // 1 Manager
        User manager = User.builder()
                .username("manager")
                .email("manager@stocklab.vn")
                .password(passwordEncoder.encode("manager123"))
                .fullName("Manager StockLab")
                .phone("0901000002")
                .role(Role.MANAGER)
                .balance(new BigDecimal("50000000.00"))
                .build();
        userRepository.save(manager);
        log.info("  ✅ Manager: {} ({})", manager.getUsername(), manager.getEmail());

        // 3 Regular Users
        for (int i = 1; i <= 3; i++) {
            User user = User.builder()
                    .username("user" + i)
                    .email("user" + i + "@stocklab.vn")
                    .password(passwordEncoder.encode("user123"))
                    .fullName("Người dùng " + i)
                    .phone("090100000" + (i + 2))
                    .role(Role.USER)
                    .balance(new BigDecimal("10000000.00"))
                    .build();
            userRepository.save(user);
            log.info("  ✅ User: {} ({})", user.getUsername(), user.getEmail());
        }

        log.info("🎉 Seed user hoàn tất! Đã tạo 5 tài khoản.");
    }

    private void seedStocks() {
        if (stockRepository.count() > 0) {
            log.info("📊 Database đã có dữ liệu cổ phiếu, bỏ qua seeding.");
            return;
        }

        log.info("🌱 Bắt đầu seed dữ liệu cổ phiếu...");

        List<StockSeedData> seedData = List.of(
                new StockSeedData("VNM", "Vinamilk", "HOSE", 78000),
                new StockSeedData("VIC", "Vingroup", "HOSE", 42000),
                new StockSeedData("FPT", "FPT Corporation", "HOSE", 125000),
                new StockSeedData("HPG", "Hòa Phát Group", "HOSE", 26000),
                new StockSeedData("MWG", "Thế Giới Di Động", "HOSE", 52000),
                new StockSeedData("VCB", "Vietcombank", "HOSE", 92000),
                new StockSeedData("BID", "BIDV", "HOSE", 47000),
                new StockSeedData("CTG", "VietinBank", "HOSE", 35000),
                new StockSeedData("TCB", "Techcombank", "HOSE", 38000),
                new StockSeedData("MBB", "MB Bank", "HOSE", 24000),
                new StockSeedData("VPB", "VPBank", "HOSE", 19000),
                new StockSeedData("VHM", "Vinhomes", "HOSE", 40000),
                new StockSeedData("MSN", "Masan Group", "HOSE", 82000),
                new StockSeedData("GAS", "PV Gas", "HOSE", 75000),
                new StockSeedData("VRE", "Vincom Retail", "HOSE", 23000),
                new StockSeedData("SSI", "SSI Securities", "HOSE", 32000),
                new StockSeedData("VND", "VNDirect", "HOSE", 18000),
                new StockSeedData("ACB", "ACB Bank", "HNX", 25000),
                new StockSeedData("SHB", "SHB Bank", "HNX", 12000),
                new StockSeedData("PVS", "PV Shipyard", "HNX", 28000)
        );

        Random random = new Random(42); // Fixed seed for reproducible data

        for (StockSeedData data : seedData) {
            Stock stock = createStock(data, random);
            stockRepository.save(stock);

            List<StockPriceHistory> history = generatePriceHistory(stock, data.basePrice, random);
            priceHistoryRepository.saveAll(history);

            log.info("  ✅ {} — {} ({}đ, {} ngày lịch sử)",
                    stock.getTicker(), stock.getCompanyName(),
                    stock.getCurrentPrice(), history.size());
        }

        log.info("🎉 Seed cổ phiếu hoàn tất! Đã tạo {} cổ phiếu.", seedData.size());
    }

    private Stock createStock(StockSeedData data, Random random) {
        double basePrice = data.basePrice;

        // Simulate today's trading
        double openPrice = basePrice * (1 + (random.nextDouble() - 0.5) * 0.02);
        double currentPrice = openPrice * (1 + (random.nextDouble() - 0.5) * 0.04);
        double highPrice = Math.max(openPrice, currentPrice) * (1 + random.nextDouble() * 0.015);
        double lowPrice = Math.min(openPrice, currentPrice) * (1 - random.nextDouble() * 0.015);
        double referencePrice = basePrice;
        double change = currentPrice - referencePrice;
        double changePercent = (change / referencePrice) * 100;
        long volume = (long) (random.nextDouble() * 5_000_000 + 500_000);

        return Stock.builder()
                .ticker(data.ticker)
                .companyName(data.companyName)
                .exchange(data.exchange)
                .currentPrice(toBigDecimal(currentPrice))
                .openPrice(toBigDecimal(openPrice))
                .highPrice(toBigDecimal(highPrice))
                .lowPrice(toBigDecimal(lowPrice))
                .referencePrice(toBigDecimal(referencePrice))
                .volume(volume)
                .change(toBigDecimal(change))
                .changePercent(Math.round(changePercent * 100.0) / 100.0)
                .build();
    }

    private List<StockPriceHistory> generatePriceHistory(Stock stock, double basePrice, Random random) {
        List<StockPriceHistory> history = new ArrayList<>();
        LocalDate today = LocalDate.now();
        double price = basePrice * 0.85; // Start 15% lower 90 days ago

        for (int i = 90; i >= 1; i--) {
            LocalDate date = today.minusDays(i);

            // Skip weekends
            if (date.getDayOfWeek().getValue() >= 6) continue;

            // Random daily variation (-3% to +3%)
            double dailyChange = (random.nextDouble() - 0.48) * 0.06; // Slight upward bias
            price = price * (1 + dailyChange);

            // Ensure price stays reasonable (±40% from base)
            price = Math.max(basePrice * 0.6, Math.min(basePrice * 1.4, price));

            double open = price * (1 + (random.nextDouble() - 0.5) * 0.02);
            double close = price;
            double high = Math.max(open, close) * (1 + random.nextDouble() * 0.015);
            double low = Math.min(open, close) * (1 - random.nextDouble() * 0.015);
            long vol = (long) (random.nextDouble() * 3_000_000 + 200_000);

            history.add(StockPriceHistory.builder()
                    .stock(stock)
                    .openPrice(toBigDecimal(open))
                    .highPrice(toBigDecimal(high))
                    .lowPrice(toBigDecimal(low))
                    .closePrice(toBigDecimal(close))
                    .volume(vol)
                    .tradingDate(date)
                    .build());
        }

        return history;
    }

    private BigDecimal toBigDecimal(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private void seedAdminUser() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@stocklab.com")
                    .fullName("System Admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .balance(new BigDecimal("100000000.00")) // 100M VND
                    .build();
            userRepository.save(admin);
            log.info("👤 Đã tạo tài khoản admin mặc định (admin / admin123)");
        }
    }

    private void unlockAllExistingUsers() {
        List<User> users = userRepository.findAll();
        boolean changed = false;
        for (User u : users) {
            if (!u.isActive()) {
                u.setActive(true);
                changed = true;
            }
        }
        if (changed) {
            userRepository.saveAll(users);
            log.info("🔓 Đã tự động mở khoá (isActive = true) cho các tài khoản cũ do cập nhật cấu trúc Database.");
        }
    }

    private void unlockAllExistingStocks() {
        List<Stock> stocks = stockRepository.findAll();
        boolean changed = false;
        for (Stock s : stocks) {
            if (!s.isActive()) {
                s.setActive(true);
                changed = true;
            }
        }
        if (changed) {
            stockRepository.saveAll(stocks);
            log.info("🔓 Đã tự động mở khoá (isActive = true) cho các mã cổ phiếu cũ do cập nhật cấu trúc Database.");
        }
    }

    private void seedPortfolios() {
        if (portfolioRepository.count() > 0) {
            log.info("💼 Database đã có dữ liệu portfolio, bỏ qua seeding.");
            return;
        }

        log.info("🌱 Bắt đầu seed dữ liệu portfolio...");

        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.USER || u.getRole() == Role.MANAGER)
                .toList();
        List<Stock> stocks = stockRepository.findAll();

        if (users.isEmpty() || stocks.isEmpty()) {
            log.warn("⚠️ Không có user hoặc stock để seed portfolio.");
            return;
        }

        Random random = new Random(99);
        int count = 0;

        // Mỗi user sở hữu 5-7 CP ngẫu nhiên
        for (User user : users) {
            int numStocks = 5 + random.nextInt(3); // 5-7 stocks
            List<Stock> shuffled = new ArrayList<>(stocks);
            java.util.Collections.shuffle(shuffled, random);

            for (int i = 0; i < Math.min(numStocks, shuffled.size()); i++) {
                Stock stock = shuffled.get(i);
                int qty = (random.nextInt(10) + 1) * 10; // 10-100 CP (bội 10)
                double avgPrice = stock.getCurrentPrice().doubleValue() * (0.85 + random.nextDouble() * 0.2); // 85%-105% giá hiện tại

                Portfolio portfolio = Portfolio.builder()
                        .user(user)
                        .stock(stock)
                        .quantity(qty)
                        .lockedQuantity(0)
                        .avgBuyPrice(toBigDecimal(avgPrice))
                        .build();
                portfolioRepository.save(portfolio);
                count++;
            }
        }

        log.info("🎉 Seed portfolio hoàn tất! Đã tạo {} bản ghi.", count);
    }

    private void seedWatchlists() {
        if (watchlistRepository.count() > 0) {
            log.info("⭐ Database đã có dữ liệu watchlist, bỏ qua seeding.");
            return;
        }

        log.info("🌱 Bắt đầu seed dữ liệu watchlist...");

        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.USER || u.getRole() == Role.MANAGER)
                .toList();
        List<Stock> stocks = stockRepository.findAll();

        if (users.isEmpty() || stocks.isEmpty()) {
            log.warn("⚠️ Không có user hoặc stock để seed watchlist.");
            return;
        }

        Random random = new Random(77);
        int count = 0;

        // Mỗi user theo dõi 4-6 CP
        for (User user : users) {
            int numStocks = 4 + random.nextInt(3); // 4-6 stocks
            List<Stock> shuffled = new ArrayList<>(stocks);
            java.util.Collections.shuffle(shuffled, random);

            for (int i = 0; i < Math.min(numStocks, shuffled.size()); i++) {
                Watchlist watchlist = Watchlist.builder()
                        .user(user)
                        .stock(shuffled.get(i))
                        .build();
                watchlistRepository.save(watchlist);
                count++;
            }
        }

        log.info("🎉 Seed watchlist hoàn tất! Đã tạo {} bản ghi.", count);
    }

    private record StockSeedData(String ticker, String companyName, String exchange, double basePrice) {}
}
