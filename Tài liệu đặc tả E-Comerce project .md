1. #### **Actors:**

   

| \# | Actor | Description |
| ----- | :---- | :---- |
| 1 | Admin | Quản trị viên hệ thống, có quyền cao nhất. Chịu trách nhiệm quản lý người dùng (khách hàng, vendor), phân quyền, duyệt hoặc khóa tài khoản vendor, quản lý danh mục, khuyến mãi, cấu hình hệ thống (thanh toán, vận chuyển) và theo dõi báo cáo, thống kê toàn sàn. |
| 2 | Customer | Người dùng đã đăng ký và đăng nhập vào hệ thống. Có thể tìm kiếm, xem sản phẩm, quản lý giỏ hàng và wishlist, đặt hàng, thanh toán, áp dụng voucher, theo dõi đơn hàng, yêu cầu đổi trả, đánh giá sản phẩm và quản lý thông tin cá nhân, địa chỉ giao hàng.  |
| 3 | Guest | Khách vãng lai, chưa đăng ký hoặc chưa đăng nhập. Chỉ được xem danh sách và chi tiết sản phẩm, tìm kiếm, lọc sản phẩm, xem đánh giá, thêm sản phẩm vào giỏ tạm. Để đặt hàng hoặc dùng các chức năng cá nhân, Guest cần đăng ký hoặc đăng nhập để trở thành Customer.  |
| 4 | Vendor | Người bán (nhà cung cấp) đăng ký mở gian hàng trên hệ thống sau khi được Admin phê duyệt. Quản lý sản phẩm của mình (thêm, sửa, ẩn, cập nhật giá và tồn kho), xử lý đơn hàng của gian hàng, tạo khuyến mãi riêng, phản hồi đánh giá của khách, xem doanh thu và đối soát hoa hồng.  |
| 5 | Shipper | Nhân viên giao hàng, nhận đơn cần giao từ hệ thống hoặc từ vendor. Xem thông tin đơn và địa chỉ giao, cập nhật trạng thái giao hàng (đã lấy hàng, đang giao, giao thành công, giao thất bại), xác nhận thu tiền COD và báo cáo sự cố khi giao.  |

2. **Usecase (UC):**

**II.1.Guest:**

#### 

| ID | Feature | Use Case | Use Case Description |
| :---: | :---- | :---- | :---- |
| UC01  | Authentication  | Login | Guest đăng nhập bằng email/số điện thoại và mật khẩu. Hệ thống xác thực thông tin và chuyển người dùng sang khu vực phù hợp với vai trò tài khoản.  |
| UC02 | Authentication  | Register  | Guest đăng ký tài khoản mới bằng cách nhập các thông tin cần thiết như họ tên, email/số điện thoại và mật khẩu. Hệ thống kiểm tra tính hợp lệ và tạo tài khoản Customer nếu đăng ký thành công.  |
| UC03  | Product  | View Products  | Guest xem danh sách sản phẩm đang được công khai trên hệ thống, bao gồm tên, hình ảnh, giá, đánh giá và thông tin cơ bản.  |
| UC04  | Product  | Search Product  | Guest tìm kiếm sản phẩm theo tên, từ khóa hoặc nội dung liên quan để nhanh chóng tìm được sản phẩm mong muốn.  |
| UC05  | Product  | Filter Product  | Guest lọc sản phẩm theo các tiêu chí như danh mục, khoảng giá, đánh giá, thương hiệu, tình trạng và các tiêu chí khác.  |
| UC06  | Product  | Sort Product  | Guest sắp xếp danh sách sản phẩm theo giá tăng dần, giá giảm dần, độ phổ biến, đánh giá hoặc sản phẩm mới.  |
| UC07  | Product  | View Product Detail  | Guest xem chi tiết sản phẩm gồm hình ảnh, video, tên sản phẩm, giá, biến thể, mô tả, số lượng còn lại, đánh giá và thông tin Shop.  |
| UC08  | Product  | View Product Reviews  | Guest xem các đánh giá của Customer đã mua sản phẩm, bao gồm số sao, nội dung đánh giá, hình ảnh/video và thời gian đánh giá.  |
| UC09  | Category  | View Categories  | Guest xem danh sách các danh mục sản phẩm và lựa chọn danh mục để tìm kiếm các sản phẩm tương ứng.  |
| UC10  | Category  | View Category Products  | Cho phép Guest xem danh sách sản phẩm thuộc một danh mục hoặc danh mục con cụ thể.  |
| UC11  | Shop  | View Shops  | Guest xem danh sách các Shop đang hoạt động và được phép hiển thị trên hệ thống.  |
| UC12  | Shop  | Search Shop  | Guest tìm kiếm Shop theo tên hoặc từ khóa để tìm được cửa hàng mong muốn.  |
| UC13  | Shop  | View Shop Detail  | Guest xem thông tin công khai của Shop như tên Shop, logo, mô tả, đánh giá, số lượng sản phẩm và thông tin hoạt động.  |
| UC14  | Shop  | View Shop Products  | Guest xem danh sách sản phẩm đang được bán bởi một Shop cụ thể.  |
| UC15  | Shop  | View Shop Reviews  | Guest xem các đánh giá của Customer đối với Shop để tham khảo mức độ uy tín của cửa hàng.  |
| UC16  | Cart  | View Cart  | Guest xem các sản phẩm đã thêm vào giỏ hàng tạm thời, bao gồm sản phẩm, biến thể, số lượng và giá tiền.  |

#### 

**II.2. Admin:**

#### 

| ID | Feature | Use Case | Use Case Description |
| ----- | :---- | :---- | :---- |
| UC17 | Account Management | Logout | Đăng xuất khỏi hệ thống và kết thúc session. |
| UC18  | Account  | View Profile  | Admin xem thông tin tài khoản quản trị hiện tại như họ tên, email, số điện thoại, vai trò và trạng thái tài khoản.  |
| UC18  | Account  | Update Profile  | Admin cập nhật các thông tin cá nhân được phép thay đổi như họ tên, số điện thoại và thông tin liên hệ.  |
| UC19 | Account  | Change Password  | Admin thay đổi mật khẩu hiện tại bằng cách nhập mật khẩu cũ và mật khẩu mới. Hệ thống kiểm tra mật khẩu cũ trước khi cập nhật.  |
| UC20 | Account Management | Forgot Password | Customer yêu cầu đặt lại mật khẩu thông qua email khi quên mật khẩu. |
| UC21 | Account  | View Login History  | Admin xem lịch sử đăng nhập của tài khoản quản trị, bao gồm thời gian đăng nhập, trạng thái đăng nhập và thông tin thiết bị  |
| UC22 | Customer Management  | View Customers  | Admin xem danh sách các tài khoản Customer đang sử dụng hệ thống cùng các thông tin cơ bản như tên, email, trạng thái và ngày đăng ký.  |
| UC23 | Customer Management  | Search Customer  | Admin tìm kiếm Customer theo ID, tên, email hoặc số điện thoại để phục vụ việc hỗ trợ và quản lý tài khoản.  |
| UC24 | Customer Management  | View Customer Detail  | Admin xem thông tin chi tiết của Customer, bao gồm thông tin cá nhân, địa chỉ, trạng thái tài khoản và các dữ liệu mua hàng liên quan.  |
| UC25 | Customer Management  | View Customer Orders  | Admin xem lịch sử các đơn hàng của một Customer, bao gồm mã đơn, giá trị đơn, trạng thái đơn hàng, thanh toán và vận chuyển.  |
| UC26 | Customer Management  | View Customer Reviews  | Admin xem các đánh giá mà Customer đã thực hiện để kiểm tra nội dung, phát hiện đánh giá vi phạm hoặc hỗ trợ xử lý khiếu nại.  |
| UC27 | Customer Management  | Lock Customer  | Admin khóa tài khoản Customer khi tài khoản có hành vi vi phạm chính sách hoặc có dấu hiệu bất thường.  |
| UC28 | Customer Management   | Unlock Customer  | Admin mở khóa tài khoản Customer sau khi vấn đề đã được giải quyết hoặc khi xác định tài khoản không còn vi phạm.  |
| UC29 | Vendor Management  | View Vendors  | Admin xem danh sách tất cả Vendor đã đăng ký bán hàng trên hệ thống cùng trạng thái hoạt động của từng Vendor.  |
| UC30 | Vendor Management  | Search Vendor  | Admin tìm kiếm Vendor theo ID, tên, email, số điện thoại hoặc tên Shop để nhanh chóng xác định Vendor cần quản lý.  |
| UC31 | Vendor Management  | View Vendor Detail  | Admin xem thông tin chi tiết của Vendor, bao gồm thông tin tài khoản, Shop, sản phẩm, đơn hàng, doanh thu và trạng thái hoạt động.  |
| UC32 | Vendor Management  | Approve Vendor  | Admin kiểm tra thông tin đăng ký và phê duyệt tài khoản Vendor khi đáp ứng đầy đủ điều kiện tham gia bán hàng.  |
| UC33 | Vendor Management  | Reject Vendor  | Admin từ chối yêu cầu đăng ký Vendor khi thông tin không hợp lệ hoặc không đáp ứng điều kiện. Hệ thống có thể lưu lý do từ chối.  |
| UC34 | Vendor Management  | Lock Vendor  | Admin tạm khóa tài khoản Vendor khi phát hiện vi phạm chính sách, gian lận hoặc các hành vi không hợp lệ.  |
| UC35 | Vendor Management  | Unlock Vendor  | Admin mở khóa tài khoản Vendor sau khi vi phạm được giải quyết hoặc tài khoản được xác minh lại.  |
| UC36 | Vendor Management  | View Vendor Orders  | Admin xem toàn bộ đơn hàng phát sinh từ Shop của Vendor để theo dõi tình hình kinh doanh và xử lý các vấn đề liên quan.  |
| UC37 | Vendor Management  | View Vendor Revenue  | Admin xem doanh thu của Vendor theo khoảng thời gian, đơn hàng hoặc Shop để phục vụ quản lý tài chính và báo cáo.  |
| UC38 | Vendor Management  | View Vendor Violations  | Admin xem lịch sử vi phạm của Vendor, bao gồm loại vi phạm, thời gian, nội dung và hình thức xử lý đã áp dụng.  |
| UC39 | Shipping Management  | View Shippers  | Admin xem danh sách Shipper cùng thông tin tài khoản, trạng thái hoạt động và số lượng đơn đang giao.  |
| UC40 | Shipping Management  | Search Shipper  | Admin tìm kiếm Shipper theo ID, tên, số điện thoại hoặc trạng thái.  |
| UC41 | Shipping Management  | View Shipper Detail  | Admin xem thông tin chi tiết Shipper, lịch sử giao hàng và hiệu suất giao hàng.  |
| UC42 | Shipping Management  | Create Shipper  | Admin tạo tài khoản Shipper và cung cấp thông tin cần thiết để Shipper sử dụng hệ thống.  |
| UC43 | Shipping Management  | Update Shipper  | Admin cập nhật thông tin cá nhân, phương tiện hoặc trạng thái làm việc của Shipper.  |
| UC44 | Shipping Management  | Lock Shipper  | Admin khóa tài khoản Shipper khi phát hiện vi phạm hoặc cần tạm dừng quyền giao hàng.  |
| UC45 | Shipping Management  | Unlock Shipper  | Admin mở khóa tài khoản Shipper sau khi vấn đề đã được xử lý.  |
| UC46 | Shipping Management  | Assign Order  | Admin phân công một đơn hàng cho Shipper phù hợp để thực hiện giao hàng.  |
| UC47 | Shipping Management  | Reassign Order  | Admin thay đổi Shipper được phân công khi Shipper hiện tại không thể thực hiện giao hàng.  |
| UC48 | Shipping Management  | Track Shipment  | Admin theo dõi quá trình vận chuyển của đơn hàng thông qua trạng thái giao hàng được Shipper cập nhật.  |
| UC49 | Shipping Management  | View Delivery History  | Admin xem lịch sử giao hàng của Shipper để đánh giá hiệu suất và xử lý khiếu nại.  |
| UC50 | Shipping Management  | View Delivery Failure  | Admin xem các đơn giao thất bại cùng nguyên nhân và trạng thái xử lý tiếp theo.  |

#### 

**II.3.Customer:**

#### 

| ID | Feature | Use Case | Use Case Description |
| :---: | :---- | :---- | :---- |
| UC51 | Account Management | Manage Profile | Customer xem và cập nhật thông tin cá nhân (tên, avatar, SĐT). |
| UC52 | Account Management | Manage Shipping Addresses | Customer thêm, sửa, xóa và đặt địa chỉ giao hàng mặc định. |
| UC53 | Product Browsing | View Product List | Customer xem danh sách sản phẩm theo danh mục. |
| UC54 | Product Browsing | Search Product | Customer tìm kiếm sản phẩm theo từ khóa. |
| UC55 | Product Browsing | Filter & Sort Product | Customer lọc sản phẩm (giá, thương hiệu, đánh giá) và sắp xếp (giá, mới nhất, bán chạy). |
| UC56 | Product Browsing | View Product Detail | Customer xem thông tin chi tiết sản phẩm: mô tả, giá, hình ảnh, biến thể, tồn kho. |
| UC57 | Product Browsing | View Product Reviews | Customer xem đánh giá và xếp hạng của người mua trước đó. |
| UC58 | Cart | Add to Cart | Customer thêm sản phẩm (kèm biến thể và số lượng) vào giỏ hàng. |
| UC59 | Cart | View Cart | Customer xem danh sách sản phẩm trong giỏ cùng tạm tính. |
| UC60 | Cart | Update Cart Item | Customer thay đổi số lượng hoặc biến thể của sản phẩm trong giỏ. |
| UC61 | Cart | Remove Cart Item | Customer xóa một hoặc nhiều sản phẩm khỏi giỏ hàng. |
| UC62 | Wishlist | Manage Wishlist | Customer thêm hoặc xóa sản phẩm khỏi danh sách yêu thích. |
| UC63 | Checkout | Place Order | Customer xác nhận đặt hàng từ giỏ hàng sau khi hoàn tất các thông tin checkout. |
| UC64 | Checkout | Select Shipping Address | Customer chọn hoặc nhập địa chỉ giao hàng cho đơn hàng. |
| UC65 | Checkout | Select Payment Method | Customer chọn phương thức thanh toán (COD). |
| UC66 | Checkout | Apply Voucher | Customer nhập hoặc chọn voucher để giảm giá; hệ thống kiểm tra điều kiện áp dụng. |
| UC67 | Order Management | View Order History | Customer xem danh sách các đơn hàng đã đặt, lọc theo trạng thái. |
| UC68 | Order Management | Track Order | Customer xem chi tiết và theo dõi trạng thái, hành trình giao của đơn hàng. |
| UC69 | Order Management | Cancel Order | Customer hủy đơn hàng khi đơn chưa được xử lý hoặc chưa giao. |
| UC70 | Order Management | Request Return/Refund | Customer tạo yêu cầu đổi/trả/hoàn tiền kèm lý do và hình ảnh minh chứng. |
| UC71 | Review & Support | Write Product Review | Customer đánh giá sao và viết nhận xét cho sản phẩm đã mua. |
| UC73 | Review & Support | Contact Support | Customer gửi yêu cầu hỗ trợ hoặc khiếu nại đến bộ phận chăm sóc khách hàng. |

**II.4. Vendor:**

#### 

| ID | Feature | Use Case | Use Case Description |
| :---: | :---- | :---- | :---- |
| UC74 | Shop Management | Register Vendor Account | Người bán đăng ký tài khoản vendor, cung cấp thông tin gian hàng và giấy tờ xác minh (KYC), sau đó chờ Admin phê duyệt. |
| UC75 | Shop Management | Manage Shop Profile | Vendor cập nhật thông tin gian hàng: tên, logo, banner, mô tả, thông tin liên hệ, địa chỉ kho lấy hàng. |
| UC76 | Product Management | Add Product | Vendor thêm sản phẩm mới gồm tên, mô tả, giá, hình ảnh, danh mục, biến thể (size, màu, SKU) và tồn kho. |
| UC77 | Product Management | Update Product | Vendor chỉnh sửa thông tin, giá, hình ảnh hoặc biến thể của sản phẩm đã đăng. |
| UC78 | Product Management | Delete Product | Vendor xóa sản phẩm khỏi gian hàng. |
| UC79 | Product Management | Show/Hide Product | Vendor bật hoặc tắt hiển thị sản phẩm trên sàn mà không cần xóa. |
| UC80 | Product Management | Import/Export Products | Vendor thêm hoặc xuất danh sách sản phẩm hàng loạt bằng file CSV/Excel. |
| UC81 | Inventory Management | Update Stock | Vendor cập nhật số lượng tồn kho theo từng sản phẩm/biến thể. |
| UC82 | Inventory Management | View Low Stock Alert | Vendor xem cảnh báo các sản phẩm sắp hết hàng để kịp nhập thêm. |
| UC83 | Order Management | View Shop Orders | Vendor xem danh sách đơn hàng của gian hàng, lọc theo trạng thái, thời gian. |
| UC84 | Order Management | View Order Detail | Vendor xem chi tiết đơn: sản phẩm, thông tin người nhận, phương thức thanh toán và vận chuyển. |
| UC85 | Order Management | Confirm/Reject Order | Vendor xác nhận hoặc từ chối đơn hàng mới (kèm lý do khi từ chối, ví dụ hết hàng). |
| UC86 | Order Management | Update Order Status | Vendor cập nhật trạng thái đơn: đang chuẩn bị, đã đóng gói, sẵn sàng giao cho Shipper. |
| UC87 | Order Management | Refund Request | Vendor xem xét, chấp nhận hoặc từ chối yêu cầu đổi trả/hoàn tiền do Customer gửi. |
| UC88 | Promotion | Create Shop Voucher | Vendor tạo voucher riêng cho gian hàng (theo % hoặc số tiền, hạn dùng, giá trị đơn tối thiểu, số lượt dùng). |
| UC89 | Promotion | Manage Shop Voucher | Vendor xem, sửa, tạm dừng hoặc xóa voucher của gian hàng. |
| UC90 | Promotion | Create Discount Campaign | Vendor thiết lập giảm giá sản phẩm theo thời gian (flash sale, combo, mua kèm). |
| UC90 | Review & Communication | View Product Reviews | Người dùng xem đánh giá và xếp hạng của người mua đối với sản phẩm. |
| UC91 | Review & Communication | Reply to Review | Vendor phản hồi đánh giá của Customer. |
| UC92 | Review & Communication | Answer Product Question | Vendor trả lời câu hỏi của Customer về sản phẩm. |


### **II.5 Shipper**

| ID | Feature | Use Case | Use Case Description |
| ----- | ----- | ----- | ----- |
| UC93 | Account Management | View Profile | Shipper xem thông tin tài khoản: họ tên, email, số điện thoại, phương tiện, biển số, khu vực hoạt động và trạng thái làm việc. |
| UC94 | Account Management | Update Work Status | Shipper bật hoặc tắt trạng thái nhận đơn (sẵn sàng, nghỉ). |
| UC95 | Dashboard | View Dashboard | Shipper xem tổng quan: số đơn cần lấy hàng, đang giao, đã giao hôm nay, tiền COD đã thu hôm nay và hiệu suất giao hàng. |
| UC96 | Delivery | View Assigned Orders | Shipper xem danh sách đơn được Admin phân công, lọc theo trạng thái. |
| UC97 | Delivery | View Delivery Detail | Shipper xem chi tiết đơn cần giao: sản phẩm, địa chỉ lấy hàng, người nhận, số điện thoại, địa chỉ giao và số tiền COD cần thu. |
| UC98 | Delivery | Confirm Pickup | Shipper xác nhận đã lấy hàng từ gian hàng. |
| UC99 | Delivery | Start Delivery | Shipper bắt đầu giao đơn hàng. |
| UC100 | Delivery | Confirm Delivered | Shipper xác nhận giao hàng thành công. |
| UC101 | Payment | Confirm COD Collection | Shipper xác nhận đã thu đủ tiền COD khi giao thành công. |
| UC102 | Delivery | Report Delivery Failure | Shipper báo giao thất bại kèm lý do; đơn chuyển cho Admin xử lý (giao lại, đổi Shipper hoặc hoàn hàng). |
| UC103 | Delivery | View Delivery History | Shipper xem lịch sử các đơn đã giao thành công hoặc thất bại. |

**2. Yêu cầu phi chức năng cho khu vực Shipper**

| Nhóm |	Yêu cầu |
| ----- | ----- |
| Bảo mật	| Mọi API /api/shipper/** chỉ role SHIPPER; mỗi Shipper chỉ thấy đơn của chính mình (đơn người khác trả 404); tài khoản bị khóa mất quyền ngay; tài khoản còn cờ buộc đổi mật khẩu bị chặn các chức năng khác| 
| Toàn vẹn dữ liệu | Chuyển trạng thái giao hàng theo đúng thứ tự cho phép, kiểm tra ở server (không tin giao diện), chống thao tác trùng bằng cập nhật có điều kiện; mỗi lần đổi trạng thái ghi vào shipment_events| 
| Quyền riêng tư | Số điện thoại và địa chỉ khách chỉ hiển thị với đơn đang giao; lịch sử chỉ hiện mã đơn, trạng thái, thời gian; không ghi dữ liệu cá nhân vào log| 
| Hiệu năng |	Dashboard và danh sách đơn tải trong vòng 2 giây với dữ liệu bình thường; danh sách có phân trang| 
| Thao tác | quan trọng	Giao thành công và giao thất bại phải có hộp thoại xác nhận (không hoàn tác được)| 
| Độ tin cậy |	Mạng yếu: hiển thị lỗi rõ ràng kèm nút "Thử lại", không gửi trùng khi bấm nhiều lần| 
| Truy cập |	Độ tương phản đạt WCAG AA, dùng được bằng bàn phím, nhãn đầy đủ cho ô nhập
Múi giờ	Mọi mốc "hôm nay" tính theo Asia/Ho_Chi_Minh| 