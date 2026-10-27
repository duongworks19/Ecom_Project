package com.vic.ecom.services;

import com.vic.ecom.dto.CartDtos;
import com.vic.ecom.entity.*;
import com.vic.ecom.repository.*;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartCommandService {
    private final CartRepository carts;
    private final CartItemRepository items;
    private final ProductVariantRepository variants;
    private final UserRepository users;
    private final CartQueryService query;

    @Transactional
    public CartDtos.MutationResponse add(Authentication auth, CartDtos.AddRequest req) {
        ProductVariant v = variant(req.variantId());
        ensureAvailable(v);
        Cart cart = carts.findFirstByUserIdOrderByIdAsc(query.userId(auth)).orElseGet(() -> {
            Cart c = new Cart(); c.setUserId(query.userId(auth)); return carts.save(c);
        });
        CartItem row = items.findByCartIdAndVariantId(cart.getId(), v.getId()).orElseGet(() -> {
            CartItem i = new CartItem(); i.setCartId(cart.getId()); i.setVariantId(v.getId()); i.setQuantity(0); return i;
        });
        int quantity = row.getQuantity() + req.quantity();
        ensureStock(v, quantity);
        row.setQuantity(quantity);
        CartItem saved = items.save(row);
        return new CartDtos.MutationResponse(saved.getId(), saved.getVariantId(), saved.getQuantity());
    }

    @Transactional
    public CartDtos.MutationResponse update(Authentication auth, Long itemId, CartDtos.UpdateRequest req) {
        if (req == null || (req.quantity() == null && req.variantId() == null)) throw CustomerAccountException.badRequest("EMPTY_UPDATE", "Cần quantity hoặc variantId", null);
        Cart cart = ownedCart(auth);
        CartItem row = items.findById(itemId).filter(i -> i.getCartId().equals(cart.getId()))
                .orElseThrow(() -> CustomerAccountException.notFound("CART_ITEM_NOT_FOUND", "Không tìm thấy sản phẩm trong giỏ hàng"));
        ProductVariant old = variant(row.getVariantId());
        ProductVariant target = req.variantId() == null ? old : variant(req.variantId());
        if (!target.getProduct().getId().equals(old.getProduct().getId())) throw CustomerAccountException.unprocessable("VARIANT_MISMATCH", "Variant phải cùng sản phẩm", "variantId");
        ensureAvailable(target);
        int quantity = req.quantity() == null ? row.getQuantity() : req.quantity();
        CartItem merged = items.findByCartIdAndVariantId(cart.getId(), target.getId()).orElse(null);
        if (merged != null && !merged.getId().equals(row.getId())) {
            quantity += merged.getQuantity(); items.delete(row); row = merged;
        }
        ensureStock(target, quantity);
        row.setVariantId(target.getId()); row.setQuantity(quantity);
        CartItem saved = items.save(row);
        return new CartDtos.MutationResponse(saved.getId(), saved.getVariantId(), saved.getQuantity());
    }

    @Transactional public void delete(Authentication auth, Long itemId) { items.delete(ownedItem(auth, itemId)); }

    @Transactional
    public CartDtos.RemovedResponse bulkDelete(Authentication auth, CartDtos.BulkDeleteRequest req) {
        if (req == null || req.itemIds() == null || req.itemIds().isEmpty() || req.itemIds().size() > 100) throw CustomerAccountException.badRequest("INVALID_ITEM_IDS", "Danh sách itemIds phải từ 1 đến 100 phần tử", "itemIds");
        Cart cart = ownedCart(auth); int removed = items.deleteByCartIdAndIdIn(cart.getId(), req.itemIds()); return new CartDtos.RemovedResponse(removed);
    }

    @Transactional
    public CartDtos.RemovedResponse deleteUnavailable(Authentication auth) {
        Cart cart = ownedCart(auth); int removed = 0;
        for (CartItem i : items.findByCartIdOrderByIdAsc(cart.getId())) {
            ProductVariant v = variant(i.getVariantId());
            if (!query.isAvailable(v)) { items.delete(i); removed++; }
        }
        return new CartDtos.RemovedResponse(removed);
    }

    private CartItem ownedItem(Authentication auth, Long id) { return items.findById(id).filter(i -> i.getCartId().equals(ownedCart(auth).getId())).orElseThrow(() -> CustomerAccountException.notFound("CART_ITEM_NOT_FOUND", "Không tìm thấy sản phẩm trong giỏ hàng")); }
    private Cart ownedCart(Authentication auth) { return carts.findFirstByUserIdOrderByIdAsc(query.userId(auth)).orElseThrow(() -> CustomerAccountException.notFound("CART_NOT_FOUND", "Giỏ hàng chưa tồn tại")); }
    private ProductVariant variant(Long id) { return variants.findById(id).orElseThrow(() -> CustomerAccountException.notFound("VARIANT_NOT_FOUND", "Không tìm thấy phân loại sản phẩm")); }
    private void ensureAvailable(ProductVariant v) { if (!query.isAvailable(v)) throw CustomerAccountException.unprocessable("PRODUCT_UNAVAILABLE", "Sản phẩm hiện không khả dụng", "variantId"); }
    private void ensureStock(ProductVariant v, int q) { if (q > 99) throw CustomerAccountException.badRequest("INVALID_QUANTITY", "Số lượng tối đa là 99", "quantity"); if (q > v.getStockQty()) throw CustomerAccountException.unprocessable("STOCK_EXCEEDED", "Số lượng vượt tồn kho", "quantity"); }
}
