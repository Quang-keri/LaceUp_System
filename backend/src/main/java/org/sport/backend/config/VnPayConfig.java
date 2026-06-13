package org.sport.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Component
public class VnPayConfig {

    @Value("${vnpay.version}")
    private String version;

    @Value("${vnpay.command}")
    private String command;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    private static final TimeZone VN_TIMEZONE = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
    private static final String DATE_PATTERN = "yyyyMMddHHmmss";

    // =========================
    // PUBLIC: CREATE PAYMENT URL
    // =========================
    public String createPaymentUrl(long orderCode, long amountVnd, String orderInfo) {

        Map<String, String> params = buildParams(orderCode, amountVnd, orderInfo);

        String query = buildQueryString(params);
        String hashData = buildHashData(params);
        String secureHash = hmacSHA512(hashSecret, hashData);

        return payUrl + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    // =========================
    // PARAM BUILDER
    // =========================
    private Map<String, String> buildParams(long orderCode, long amountVnd, String orderInfo) {

        Map<String, String> params = new HashMap<>();

        params.put("vnp_Version", version);
        params.put("vnp_Command", command);
        params.put("vnp_TmnCode", tmnCode);

        // VNPay yêu cầu *100
        params.put("vnp_Amount", String.valueOf(amountVnd * 100));
        params.put("vnp_CurrCode", "VND");

        params.put("vnp_TxnRef", String.valueOf(orderCode));
        params.put("vnp_OrderInfo",
                orderInfo != null ? orderInfo : "Thanh toan don hang " + orderCode);

        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");

        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", getClientIp());

        String createDate = formatNow();
        params.put("vnp_CreateDate", createDate);

        Calendar expire = Calendar.getInstance(VN_TIMEZONE);
        expire.setTime(new Date());
        expire.add(Calendar.MINUTE, 15);
        params.put("vnp_ExpireDate", new SimpleDateFormat(DATE_PATTERN).format(expire.getTime()));

        return params;
    }

    // =========================
    // QUERY STRING (URL)
    // =========================
    private String buildQueryString(Map<String, String> params) {
        return buildSortedString(params, true);
    }

    // =========================
    // HASH DATA STRING
    // =========================
    private String buildHashData(Map<String, String> params) {
        return buildSortedString(params, false);
    }

    // =========================
    // CORE SORT + ENCODE LOGIC
    // =========================
    private String buildSortedString(Map<String, String> params, boolean encodeKey) {

        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder sb = new StringBuilder();

        try {
            for (String key : fieldNames) {
                String value = params.get(key);

                if (value == null || value.isEmpty()) continue;

                if (sb.length() > 0) sb.append("&");

                String encodedKey = URLEncoder.encode(key, StandardCharsets.UTF_8);
                String encodedValue = URLEncoder.encode(value, StandardCharsets.UTF_8);

                if (encodeKey) {
                    sb.append(encodedKey).append("=").append(encodedValue);
                } else {
                    sb.append(key).append("=").append(encodedValue);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error building VNPay string", e);
        }

        return sb.toString();
    }

    // =========================
    // VERIFY SIGNATURE
    // =========================
    public boolean verifySignature(Map<String, String> fields) {

        Map<String, String> data = new HashMap<>(fields);

        String secureHash = data.remove("vnp_SecureHash");
        data.remove("vnp_SecureHashType");

        if (secureHash == null) return false;

        String signData = buildHashData(data);
        String calculatedHash = hmacSHA512(hashSecret, signData);

        return calculatedHash.equalsIgnoreCase(secureHash);
    }

    // =========================
    // HMAC SHA512
    // =========================
    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            );

            hmac512.init(secretKey);

            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }

            return sb.toString();

        } catch (Exception e) {
            throw new RuntimeException("Error generating HMAC SHA512", e);
        }
    }

    // =========================
    // TIME FORMAT
    // =========================
    private String formatNow() {
        SimpleDateFormat formatter = new SimpleDateFormat(DATE_PATTERN);
        formatter.setTimeZone(VN_TIMEZONE);
        return formatter.format(new Date());
    }

    // =========================
    // CLIENT IP SAFE
    // =========================
    private String getClientIp() {
        try {
            ServletRequestAttributes attr =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attr == null) return "127.0.0.1";

            HttpServletRequest request = attr.getRequest();

            String ip = request.getHeader("X-Forwarded-For");

            if (ip != null && !ip.isEmpty()) {
                return ip.split(",")[0].trim();
            }

            return request.getRemoteAddr();

        } catch (Exception e) {
            return "127.0.0.1";
        }
    }
}