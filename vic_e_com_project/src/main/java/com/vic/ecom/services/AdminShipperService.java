package com.vic.ecom.services;

import com.vic.ecom.dto.AdminShipperDtos.*;
import com.vic.ecom.entity.*;
import com.vic.ecom.enums.*;
import com.vic.ecom.repository.*;
import com.vic.ecom.ultis.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service @RequiredArgsConstructor
public class AdminShipperService {
    private final UserRepository users; private final ShipperProfileRepository profiles;
    private final ShipmentRepository shipments; private final AccountLockLogRepository locks;
    private final ShipperPurgeRepository purge;
    private final PasswordEncoder encoder; private final MailService mail; private final AdminShipperQueryService query;
    @Value("${app.frontend-url:http://localhost:4200/login}") private String loginUrl;

    @Transactional
    public Detail create(Create req) {
        String email = normalizeEmail(req.email()), phone = CustomerAccountValidator.normalizePhone(req.phone());
        validate(req.fullName(), phone, email, req.vehicleType(), req.licensePlate(), req.serviceArea());
        if (users.existsByEmail(email)) throw CustomerAccountException.conflict("EMAIL_ALREADY_EXISTS", "Email đã được sử dụng", "email");
        if (users.existsByPhone(phone)) throw CustomerAccountException.conflict("PHONE_ALREADY_EXISTS", "Số điện thoại đã được sử dụng", "phone");
        String temp = TempPassword.generate(); User u = new User(); u.setFullName(req.fullName().trim()); u.setPhone(phone); u.setEmail(email); u.setRole(UserRole.SHIPPER); u.setStatus(UserStatus.ACTIVE); u.setMustChangePassword(true); u.setPasswordHash(encoder.encode(temp));
        try { users.save(u); ShipperProfile p = new ShipperProfile(); p.setUser(u); p.setVehicleType(req.vehicleType().trim()); p.setLicensePlate(req.licensePlate().trim().toUpperCase()); p.setServiceArea(req.serviceArea().trim()); p.setWorkStatus(ShipperWorkStatus.OFFLINE); profiles.save(p); if (Boolean.TRUE.equals(req.sendTempPasswordByEmail())) TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() { public void afterCommit() { mail.sendTemporaryPassword(email, temp, loginUrl); } }); return query.detail(p, Boolean.TRUE.equals(req.sendTempPasswordByEmail()) ? null : temp); }
        catch (DataIntegrityViolationException ex) { throw duplicateFromConstraint(ex); }
    }

    @Transactional
    public Detail update(Long id, Update req) {
        ShipperProfile p = require(id); String phone = CustomerAccountValidator.normalizePhone(req.phone());
        validate(req.fullName(), phone, "ok@example.com", req.vehicleType(), req.licensePlate(), req.serviceArea());
        if (users.existsByPhoneAndIdNot(phone, id)) throw CustomerAccountException.conflict("PHONE_ALREADY_EXISTS", "Số điện thoại đã được sử dụng", "phone");
        ShipperWorkStatus work; try { work = ShipperWorkStatus.valueOf(req.workStatus()); } catch (Exception e) { throw CustomerAccountException.unprocessable("INVALID_WORK_STATUS", "Trạng thái làm việc không hợp lệ", "workStatus"); }
        if (work == ShipperWorkStatus.BUSY) throw CustomerAccountException.unprocessable("INVALID_WORK_STATUS", "BUSY do hệ thống quản lý", "workStatus");
        User u = p.getUser(); u.setFullName(req.fullName().trim()); u.setPhone(phone); p.setVehicleType(req.vehicleType().trim()); p.setLicensePlate(req.licensePlate().trim().toUpperCase()); p.setServiceArea(req.serviceArea().trim()); p.setWorkStatus(work); users.save(u); profiles.save(p); return query.detail(p, null);
    }

    @Transactional public Status lock(Long id, String reason, String principal) { ShipperProfile p = require(id); User u = p.getUser(); if (u.getStatus() != UserStatus.ACTIVE) throw CustomerAccountException.conflict("ALREADY_LOCKED", "Shipper đã bị khóa", null); if (shipments.existsByShipper_IdAndStatusIn(p.getId(), java.util.List.of(ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING))) throw CustomerAccountException.conflict("HAS_ACTIVE_SHIPMENTS", "Shipper còn đơn đang giao, hãy đổi shipper trước khi khóa", null); u.setStatus(UserStatus.LOCKED); p.setWorkStatus(ShipperWorkStatus.OFFLINE); saveLog(u, reason, principal, AccountAction.LOCK); notifyLocked(u, reason); return new Status(id, u.getStatus().name()); }
    @Transactional public Status unlock(Long id, String reason, String principal) { ShipperProfile p = require(id); User u = p.getUser(); if (u.getStatus() != UserStatus.LOCKED) throw CustomerAccountException.conflict("NOT_LOCKED", "Shipper chưa bị khóa", null); u.setStatus(UserStatus.ACTIVE); saveLog(u, reason, principal, AccountAction.UNLOCK); return new Status(id, u.getStatus().name()); }

    private void notifyLocked(User user, String reason) {
        String email = user.getEmail();
        String name = user.getFullName();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                mail.sendShipperLocked(email, name, reason);
            }
        });
    }
    @Transactional
    public void permanentlyDelete(Long id) {
        ShipperProfile profile = require(id);
        User user = profile.getUser();
        if (user.getStatus() != UserStatus.LOCKED) {
            throw CustomerAccountException.conflict("SHIPPER_MUST_BE_LOCKED", "Chỉ được xóa shipper đã khóa", null);
        }
        if (shipments.existsByShipper_IdAndStatusIn(profile.getId(),
                java.util.List.of(ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING))) {
            throw CustomerAccountException.conflict("HAS_ACTIVE_SHIPMENTS",
                    "Không thể xóa khi shipper còn đơn đang giao", null);
        }
        purge.deleteAllOwnedData(profile.getId(), user.getId());
    }
    private ShipperProfile require(Long id) { return profiles.findByUserId(id).filter(p -> p.getUser().getRole() == UserRole.SHIPPER).orElseThrow(() -> CustomerAccountException.notFound("SHIPPER_NOT_FOUND", "Không tìm thấy shipper")); }
    private void saveLog(User target, String reason, String principal, AccountAction action) { if (reason != null && reason.trim().length() > 500) throw CustomerAccountException.unprocessable("INVALID_REASON", "Lý do tối đa 500 ký tự", "reason"); User admin = users.findByEmail(principal).orElseThrow(() -> CustomerAccountException.unauthorized("Unauthorized")); AccountLockLog log = new AccountLockLog(); log.setUser(target); log.setPerformedBy(admin); log.setAction(action); log.setReason(reason == null ? null : reason.trim()); locks.save(log); }
    private String normalizeEmail(String email) { return email == null ? "" : email.trim().toLowerCase(); }
    private void validate(String name, String phone, String email, String vehicle, String plate, String area) { if (!CustomerAccountValidator.isValidFullName(name)) invalid("fullName", "Họ tên không hợp lệ"); if (!CustomerAccountValidator.isValidVnPhone(phone)) invalid("phone", "Số điện thoại không hợp lệ"); if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") || email.length() > 255) invalid("email", "Email không hợp lệ"); if (blankMax(vehicle, 50)) invalid("vehicleType", "Loại xe không hợp lệ"); if (blankMax(plate, 20)) invalid("licensePlate", "Biển số không hợp lệ"); if (blankMax(area, 255)) invalid("serviceArea", "Khu vực phục vụ không hợp lệ"); }
    private boolean blankMax(String s, int max) { return s == null || s.trim().isEmpty() || s.trim().length() > max; }
    private void invalid(String field, String message) { throw CustomerAccountException.unprocessable("INVALID_" + field.toUpperCase(), message, field); }
    private RuntimeException duplicateFromConstraint(DataIntegrityViolationException ex) { String m = ex.getMostSpecificCause().getMessage(); return CustomerAccountException.conflict(m != null && m.toLowerCase().contains("phone") ? "PHONE_ALREADY_EXISTS" : "EMAIL_ALREADY_EXISTS", "Thông tin đã được sử dụng", m != null && m.toLowerCase().contains("phone") ? "phone" : "email"); }
}
