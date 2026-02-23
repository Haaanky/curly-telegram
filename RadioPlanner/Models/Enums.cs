namespace RadioPlanner.Models;

public enum EquipmentCategory { VHF, HF, UHF, SHF, SATCOM, DATALINK }

public enum UnitType { HQ, INF, ARMOR, ARTY, ENG, LOG, SIGNAL, RECON }

public enum Echelon { ARMY, CORPS, DIV, BDE, BTN, COY, PLT }

public enum WaveformType { AM, FM, USB, LSB, WBFM, FSK, PSK, QAM }

public enum LinkStatus { Planned, Active, Degraded, Failed }

public enum NetType { COMMAND, ADMIN_LOG, FIRE_SUPPORT, AIR, DATA, COORD }

public enum AppView { Map, Org, Spectrum, Timeline, Planning }

public enum CoordSystem { WGS84, SWEREF99, RT90 }
