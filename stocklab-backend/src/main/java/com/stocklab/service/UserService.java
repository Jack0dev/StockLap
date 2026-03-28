package com.stocklab.service;

import com.stocklab.dto.*;
import com.stocklab.model.Role;
import com.stocklab.model.User;
import org.springframework.security.authentication.DisabledException;
import com.stocklab.repository.UserRepository;
import com.stocklab.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final OtpService otpService;

    // Cache tạm thời thông tin đăng ký (email -> RegisterRequest)
    private final Map<String, RegisterRequest> pendingRegistrations = new ConcurrentHashMap<>();

    public ApiResponse<String> register(RegisterRequest request) {
        // Kiểm tra username đã tồn tại
        if (userRepository.existsByUsername(request.getUsername())) {
            return ApiResponse.error("Username đã được sử dụng!");
        }

        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(request.getEmail())) {
            return ApiResponse.error("Email đã được sử dụng!");
        }

        // Lưu thông tin đăng ký vào bộ nhớ tạm
        pendingRegistrations.put(request.getEmail(), request);

        // Gửi OTP qua email
        try {
            otpService.sendOtp(request.getEmail());
            return ApiResponse.success("Vui lòng kiểm tra email để lấy mã OTP xác thực.");
        } catch (Exception e) {
            return ApiResponse.success("Đã gửi thông tin đăng ký, tuy nhiên gửi OTP bị lỗi. Vui lòng nhấn gửi thử lại.");
        }
    }

    public ApiResponse<String> resendRegistrationOtp(String email) {
        if (!pendingRegistrations.containsKey(email)) {
            // Kiểm tra xem user có thực sự đang đăng ký dở hay không
            if (userRepository.existsByEmail(email)) {
                return ApiResponse.error("Tài khoản này đã tồn tại và được hệ thống ghi nhận.");
            }
            return ApiResponse.error("Phiên đăng ký đã hết hạn hoặc email không hợp lệ.");
        }
        
        otpService.sendOtp(email);
        return ApiResponse.success("Đã gửi lại mã OTP đến email của bạn.");
    }

    public ApiResponse<String> verifyRegistrationOtp(OtpVerifyRequest request) {
        String email = request.getEmail();
        
        RegisterRequest pendingRequest = pendingRegistrations.get(email);
        if (pendingRequest == null) {
            // Nếu không có trong cache, có thể do server restart hoặc user tự đổi email
            if (userRepository.existsByEmail(email)) {
                return ApiResponse.error("Tài khoản này đã được tạo trước đó.");
            }
            return ApiResponse.error("Không tìm thấy thông tin đăng ký hoặc phiên đã hết hạn. Vui lòng đăng ký lại.");
        }

        boolean isValid = otpService.verifyOtp(email, request.getOtpCode());
        if (!isValid) {
            return ApiResponse.error("Mã OTP không chính xác hoặc đã hết hạn.");
        }

        // Khi OTP hợp lệ, tiến hành tạo User và lưu vào Database
        User user = User.builder()
                .username(pendingRequest.getUsername())
                .email(pendingRequest.getEmail())
                .password(passwordEncoder.encode(pendingRequest.getPassword()))
                .fullName(pendingRequest.getFullName())
                .phone(pendingRequest.getPhone())
                .role(Role.USER)
                .isActive(true)
                .build();

        userRepository.save(user);
        
        // Xóa thông tin tạm sau khi lưu thành công
        pendingRegistrations.remove(email);

        return ApiResponse.success("Xác thực email thành công! Tài khoản đã được tạo và kích hoạt.");
    }

    public ApiResponse<LoginResponse> login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtUtils.generateToken(userDetails);

            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new RuntimeException("User không tồn tại"));

            LoginResponse loginResponse = LoginResponse.builder()
                    .token(token)
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().name())
                    .build();

            return ApiResponse.success("Đăng nhập thành công!", loginResponse);
        } catch (DisabledException e) {
            return ApiResponse.error("Tài khoản của bạn chưa được kích hoạt hoặc đã bị khóa!");
        } catch (Exception e) {
            return ApiResponse.error("Sai username hoặc mật khẩu!");
        }
    }

    public ApiResponse<UserProfileResponse> getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        UserProfileResponse profile = UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .balance(user.getBalance())
                .lockedBalance(user.getLockedBalance())
                .availableBalance(user.getAvailableBalance())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();

        return ApiResponse.success("Lấy thông tin thành công", profile);
    }

    public ApiResponse<String> updateProfile(String username, RegisterRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                return ApiResponse.error("Email đã được sử dụng!");
            }
            user.setEmail(request.getEmail());
        }

        userRepository.save(user);
        return ApiResponse.success("Cập nhật thông tin thành công!");
    }

    public ApiResponse<String> changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ApiResponse.error("Mật khẩu cũ không chính xác!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ApiResponse.success("Đổi mật khẩu thành công!");
    }

    public ApiResponse<List<UserProfileResponse>> getAllUsers() {
        List<UserProfileResponse> users = userRepository.findAll().stream()
                .map(user -> UserProfileResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .phone(user.getPhone())
                        .role(user.getRole().name())
                        .balance(user.getBalance())
                        .lockedBalance(user.getLockedBalance())
                        .availableBalance(user.getAvailableBalance())
                        .isActive(user.isActive())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
        return ApiResponse.success("Lấy danh sách user thành công", users);
    }

    public ApiResponse<String> toggleUserLock(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
        
        if (user.getRole() == Role.ADMIN) {
            return ApiResponse.error("Không thể khoá tài khoản Admin!");
        }

        user.setActive(!user.isActive());
        userRepository.save(user);
        String status = user.isActive() ? "mở khoá" : "khoá";
        return ApiResponse.success("Đã " + status + " tài khoản " + user.getUsername() + " thành công!");
    }

    public ApiResponse<String> changeUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        try {
            Role roleEnum = Role.valueOf(newRole.toUpperCase());
            user.setRole(roleEnum);
            userRepository.save(user);
            return ApiResponse.success("Đã cấp quyền " + roleEnum.name() + " cho tài khoản " + user.getUsername() + " thành công!");
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("Quyền không hợp lệ!");
        }
    }
}
