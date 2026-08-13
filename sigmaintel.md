# SigmaIntel 데이터 컬럼 매핑

SigmaIntel 원본 Excel 컬럼과 대시보드 내부 필드의 대응 관계를 정리한 참고표입니다.

## 컬럼 목록

| # | Excel 컬럼명 | db.PLC 매핑 | 예시 데이터 |
|---|-------------|------------|-------------|
| 1 | version | version | 2026-05, 2026-06 |
| 2 | Year | period_parts.year | Y24, Y25 |
| 3 | Quarter | period_parts.quarter | 24Q1, 25Q3F |
| 4 | Company | brand | Apple, Xiaomi |
| 5 | Brands | brands | Poco, Realme |
| 6 | Series | series | F Series, X Series |
| 7 | Sub Series | sub_series | 6 Series, 5 Series |
| 8 | Models | model | Poco F6 Pro, Poco F6 |
| 9 | MainDisplaySize | display_size | 6.67, 6.79 |
| 10 | MainDisplayResolution1 | display_resolution_type | 06.1.5K, 07.WQHD+ |
| 11 | MainDisplayResolution2 | display_resolution_detail | 2712x1220, 3200x1440 |
| 12 | Panel Type | panel_type | 03.FOLED, 01.LCD |
| 13 | Backplane | backplane | LTPS, LTPO |
| 14 | Bonding | bonding | COP, COG |
| 15 | Foldable | foldable | Flat, Foldable |
| 16 | FoldType | fold_type | Flip, In-fold |
| 17 | Panel Form | panel_form | HIAA, V-Notch |
| 18 | Panel Sup | panel_supplier | CSOT, Tianma |
| 19 | TP Spec | tp_spec | on-cell, in-cell |
| 20 | TP Sup | tp_supplier | CSOT, BOE |
| 21 | SubDisplaySize | sub_display_size | -, 4.02 |
| 22 | SubDisplayResolution1 | sub_display_res_type | -, 1.5K |
| 23 | SubDisplayResolution2 | sub_display_res_detail | -, 1210x1400 |
| 24 | SubDisplayPanelType | sub_display_panel_type | -, 03.FOLED |
| 25 | Chipset Spec | chipset_spec | 8Gen2(SM8550), D8300+ |
| 26 | ChipsetSup | chipset_supplier | Qualcomm, MTK |
| 27 | Network | network | 5G, 4G |
| 28 | FingerSpec | fingerprint_spec | UD(Optical), Capacitive(Side) |
| 29 | Finger Sup | fingerprint_supplier | Goodix, Focal |
| 30 | FaceID(3D) Spec | faceid_spec | -, Face ID(3D) |
| 31 | FaceID(3D) Sup | faceid_supplier | -, AI ISP |
| 32 | Camera Spec-Rear 1st | camera_rear_1_spec | 50M(OIS), 108M |
| 33 | Camera Spec-Rear 2nd | camera_rear_2_spec | 8M, 50M(UW) |
| 34 | Camera Spec-Rear 3rd | camera_rear_3_spec | 2M, 50M(3X/tele) |
| 35 | Camera Spec-Rear 4th | camera_rear_4_spec | 50M(5.4X/periscope), dToF |
| 36 | Camera Spec-Rear 5th | camera_rear_5_spec | dToF, 3M(Multispectral) |
| 37 | Camera Sup-Rear 1st | camera_rear_1_supplier | OV50E, IMX882 |
| 38 | Camera Sup-Rear 2nd | camera_rear_2_supplier | OV8856, GC02M |
| 39 | Camera Sup-Rear 3rd | camera_rear_3_supplier | OV02B, GC02M |
| 40 | Camera Sup-Rear 4th | camera_rear_4_supplier | IMX858, VL53L5 |
| 41 | Camera Sup-Rear 5th | camera_rear_5_supplier | GC&QS, OVT&YG |
| 42 | Camera Spec-Front | camera_front_spec | 16M, 20M |
| 43 | Camera Sup-Front | camera_front_supplier | S5KP9, OV20B |
| 44 | DRAM Type | dram_type | LPDDR5X, LPDDR5 |
| 45 | NANDType | nand_type | UFS4.0, UFS3.1 |
| 46 | Memory Type | memory_type | LPDDR5X+UFS4.0, uMCP4X |
| 47 | DRAM PKG Type | dram_pkg_type | PoP, xMCP |
| 48 | Memory Package+Interface | memory_pkg_interface | PoP+UFS, uMCP |
| 49 | Dram&Nand Spec | dram_nand_spec | 12GB+256GB, 8GB+256GB/12GB+512GB |
| 50 | Price with standar version (CNY) | price_cny | 39xx, 30xx |
| 51 | Price Segment | price_segment | 06.3000-4000, 04.2000-2500 |
| 52 | Launced Time | launched_time | 2024-05, 2024-01 |
| 53 | IDH/ODM | idh_odm | In-house, Wingtech |
| 54 | Region | region | Overseas, Global |
| 55 | Volume(mil.) | volume | 0.11, 1.31 |
