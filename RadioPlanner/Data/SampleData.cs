using RadioPlanner.Models;

namespace RadioPlanner.Data;

public static class SampleData
{
    // ── Equipment Catalog ────────────────────────────────────────────────────

    public static readonly List<RadioEquipment> EquipmentCatalog =
    [
        new()
        {
            Id = "ra180", Name = "RA 180", Model = "RA 180",
            Category = EquipmentCategory.VHF,
            FreqMinMhz = 30, FreqMaxMhz = 88, MaxPowerW = 50,
            RxSensitivityDbm = -113, AntennaGainDbi = 2,
            Description = "Markbunden VHF-radio",
        },
        new()
        {
            Id = "ra190", Name = "RA 190", Model = "RA 190",
            Category = EquipmentCategory.VHF,
            FreqMinMhz = 30, FreqMaxMhz = 512, MaxPowerW = 100,
            RxSensitivityDbm = -110, AntennaGainDbi = 3,
            Description = "VHF/UHF multibands-radio",
        },
        new()
        {
            Id = "hf3000", Name = "HF-3000", Model = "HF-3000",
            Category = EquipmentCategory.HF,
            FreqMinMhz = 2, FreqMaxMhz = 30, MaxPowerW = 200,
            RxSensitivityDbm = -120, AntennaGainDbi = 0,
            Description = "Kortvågsradio för lång räckvidd",
        },
        new()
        {
            Id = "uhf_man", Name = "UHF Manuportabel", Model = "UHF-portable",
            Category = EquipmentCategory.UHF,
            FreqMinMhz = 225, FreqMaxMhz = 512, MaxPowerW = 5,
            RxSensitivityDbm = -108, AntennaGainDbi = 0,
            Description = "Manuportabel UHF-radio",
        },
        new()
        {
            Id = "satcom1", Name = "SATCOM Terminal", Model = "SATCOM-L",
            Category = EquipmentCategory.SATCOM,
            FreqMinMhz = 1525, FreqMaxMhz = 1660, MaxPowerW = 20,
            RxSensitivityDbm = -105, AntennaGainDbi = 12,
            Description = "Satellitkommunikationsterminal",
        },
    ];

    private static RadioEquipment Eq(string id) =>
        EquipmentCatalog.First(e => e.Id == id);

    // ── Sample Units ──────────────────────────────────────────────────────────

    public static List<Unit> InitialUnits =>
    [
        new()
        {
            Id = "u_stab", Name = "1. Brigadens Stab", ShortName = "1 BGSTAB",
            Type = UnitType.HQ, Echelon = Echelon.BDE, Color = "#ef4444",
            Position = new(59.33, 18.07),
            Vehicles =
            [
                new()
                {
                    Id = "v_stab1", Name = "Stabsbandvagn 1", CallSign = "ALFA 01",
                    Type = "CV90C2", Position = new(59.33, 18.07), UnitId = "u_stab",
                    Equipment = [Eq("ra190"), Eq("hf3000"), Eq("satcom1")],
                },
            ],
        },
        new()
        {
            Id = "u_1mek", Name = "1. Mekaniserade Bataljon", ShortName = "1 MEK BTN",
            Type = UnitType.ARMOR, Echelon = Echelon.BTN, ParentId = "u_stab",
            Color = "#3b82f6", Position = new(59.36, 18.04),
            Vehicles =
            [
                new()
                {
                    Id = "v_1mek_stab", Name = "Bataljonstab", CallSign = "BRAVO 01",
                    Type = "Pansarbandvagn 302", Position = new(59.36, 18.04), UnitId = "u_1mek",
                    Equipment = [Eq("ra190"), Eq("ra180")],
                },
                new()
                {
                    Id = "v_1mek_k1", Name = "1. Kompani Ledning", CallSign = "BRAVO 11",
                    Type = "CV90", Position = new(59.375, 18.01), UnitId = "u_1mek",
                    Equipment = [Eq("ra180")],
                },
            ],
        },
        new()
        {
            Id = "u_2mek", Name = "2. Mekaniserade Bataljon", ShortName = "2 MEK BTN",
            Type = UnitType.ARMOR, Echelon = Echelon.BTN, ParentId = "u_stab",
            Color = "#8b5cf6", Position = new(59.30, 18.12),
            Vehicles =
            [
                new()
                {
                    Id = "v_2mek_stab", Name = "Bataljonstab", CallSign = "CHARLIE 01",
                    Type = "Pansarbandvagn 302", Position = new(59.30, 18.12), UnitId = "u_2mek",
                    Equipment = [Eq("ra190"), Eq("hf3000")],
                },
                new()
                {
                    Id = "v_2mek_k1", Name = "1. Kompani Ledning", CallSign = "CHARLIE 11",
                    Type = "CV90", Position = new(59.285, 18.15), UnitId = "u_2mek",
                    Equipment = [Eq("ra180"), Eq("uhf_man")],
                },
            ],
        },
        new()
        {
            Id = "u_signal", Name = "Signalkompani", ShortName = "SIGKOMP",
            Type = UnitType.SIGNAL, Echelon = Echelon.COY, ParentId = "u_stab",
            Color = "#f59e0b", Position = new(59.325, 18.09),
            Vehicles =
            [
                new()
                {
                    Id = "v_sig_radio", Name = "Radionode Alpha", CallSign = "DELTA 01",
                    Type = "Terrängbil 6x6", Position = new(59.325, 18.09), UnitId = "u_signal",
                    Equipment = [Eq("ra190"), Eq("hf3000"), Eq("satcom1")],
                },
            ],
        },
    ];

    // ── Sample Radio Links ────────────────────────────────────────────────────

    public static List<RadioLink> InitialLinks
    {
        get
        {
            var now = DateTime.UtcNow;
            DateTime T(double hours) => now.AddHours(hours);

            return
            [
                new()
                {
                    Id = "link_cmd1", Name = "BDE CMD NET", NetName = "CMD-01",
                    NetType = NetType.COMMAND,
                    FromNodeId = "v_stab1", ToNodeId = "v_1mek_stab",
                    EquipmentFromId = "ra190", EquipmentToId = "ra190",
                    FrequencyMhz = 45.5, BandwidthKhz = 25, Waveform = WaveformType.FM,
                    TxPowerW = 50, StartTime = T(-1), EndTime = T(23),
                    Status = LinkStatus.Active, Notes = "Primärt befälsnät",
                },
                new()
                {
                    Id = "link_cmd2", Name = "BDE CMD NET", NetName = "CMD-01",
                    NetType = NetType.COMMAND,
                    FromNodeId = "v_stab1", ToNodeId = "v_2mek_stab",
                    EquipmentFromId = "ra190", EquipmentToId = "ra190",
                    FrequencyMhz = 45.5, BandwidthKhz = 25, Waveform = WaveformType.FM,
                    TxPowerW = 50, StartTime = T(-1), EndTime = T(23),
                    Status = LinkStatus.Active,
                },
                new()
                {
                    Id = "link_hf1", Name = "HF LONG HAUL", NetName = "HF-ALFA",
                    NetType = NetType.COMMAND,
                    FromNodeId = "v_stab1", ToNodeId = "v_sig_radio",
                    EquipmentFromId = "hf3000", EquipmentToId = "hf3000",
                    FrequencyMhz = 8.5, BandwidthKhz = 6, Waveform = WaveformType.USB,
                    TxPowerW = 100, StartTime = T(0), EndTime = T(12),
                    Status = LinkStatus.Planned, Notes = "Backup lång räckvidd",
                },
                new()
                {
                    Id = "link_log1", Name = "LOG NET", NetName = "LOG-01",
                    NetType = NetType.ADMIN_LOG,
                    FromNodeId = "v_sig_radio", ToNodeId = "v_1mek_k1",
                    EquipmentFromId = "ra190", EquipmentToId = "ra180",
                    FrequencyMhz = 68.25, BandwidthKhz = 25, Waveform = WaveformType.FM,
                    TxPowerW = 20, StartTime = T(-2), EndTime = T(22),
                    Status = LinkStatus.Active,
                },
                new()
                {
                    Id = "link_sat1", Name = "SATCOM LINK", NetName = "SAT-01",
                    NetType = NetType.DATA,
                    FromNodeId = "v_stab1", ToNodeId = "v_sig_radio",
                    EquipmentFromId = "satcom1", EquipmentToId = "satcom1",
                    FrequencyMhz = 1545.0, BandwidthKhz = 500, Waveform = WaveformType.PSK,
                    TxPowerW = 10, StartTime = T(-1), EndTime = T(47),
                    Status = LinkStatus.Active, Notes = "Satellit backhaul",
                },
            ];
        }
    }

    // ── Sample Frequency Nets ─────────────────────────────────────────────────

    public static List<FrequencyNet> InitialNets =>
    [
        new()
        {
            Id = "net_cmd", Name = "Befälsnät BDE",
            PrimaryFreqMhz = 45.5, AltFreqMhz = 46.0,
            Waveform = WaveformType.FM, NetType = NetType.COMMAND,
            MemberNodeIds = ["v_stab1", "v_1mek_stab", "v_2mek_stab"],
            Color = "#ef4444",
        },
        new()
        {
            Id = "net_log", Name = "Logistiknät",
            PrimaryFreqMhz = 68.25,
            Waveform = WaveformType.FM, NetType = NetType.ADMIN_LOG,
            MemberNodeIds = ["v_sig_radio", "v_1mek_k1", "v_2mek_k1"],
            Color = "#f59e0b",
        },
        new()
        {
            Id = "net_hf", Name = "HF Länk",
            PrimaryFreqMhz = 8.5,
            Waveform = WaveformType.USB, NetType = NetType.COMMAND,
            MemberNodeIds = ["v_stab1", "v_sig_radio"],
            Color = "#8b5cf6",
        },
    ];
}
