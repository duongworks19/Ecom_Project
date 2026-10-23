package com.vic.ecom.filters;

import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.ultis.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        if (!jwtUtil.isValid(token)) {
            chain.doFilter(request, response);
            return;
        }

        String subject = jwtUtil.extractSubject(token);
        String role = jwtUtil.extractRole(token);
        Integer tokenVersionInToken = jwtUtil.extractTokenVersion(token);

        if (subject != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            var userOpt = userRepository.findByEmail(subject).or(() -> userRepository.findByPhone(subject));
            if (userOpt.isEmpty()) {
                chain.doFilter(request, response);
                return;
            }
            var user = userOpt.get();
            if (user.getStatus() == UserStatus.LOCKED || user.getStatus() == UserStatus.PENDING) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":\"UNAUTHORIZED\",\"message\":\"Tài khoản đã bị khóa hoặc chưa kích hoạt\"}");
                return;
            }

            if (tokenVersionInToken != null && user.getTokenVersion() != null && !tokenVersionInToken.equals(user.getTokenVersion())) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":\"UNAUTHORIZED\",\"message\":\"Phiên đăng nhập đã bị vô hiệu hóa\"}");
                return;
            }

            String authorityName = (role != null && role.startsWith("ROLE_"))
                    ? role
                    : "ROLE_" + (role != null ? role : "");

            List<SimpleGrantedAuthority> authorities = (role != null && !role.isBlank())
                    ? List.of(new SimpleGrantedAuthority(authorityName))
                    : List.of();

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    subject, null, authorities
            );
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        chain.doFilter(request, response);
    }
}

