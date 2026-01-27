# 🔄 Flujo del Pipeline de Telemetría

## Diagrama de Flujo Completo

```mermaid
graph TB
    Start([🚀 Inicio]) --> Pipeline{run_full_pipeline.js}
    
    %% Configuración de argumentos
    Pipeline --> Args[📋 Parsear Argumentos<br/>--manual-login<br/>--supervised<br/>--workspace]
    
    Args --> Step1[📥 PASO 1/4<br/>download_telemetry.js]
    
    %% Paso 1: Download
    Step1 --> Browser1[🌐 Iniciar Browser<br/>userDataDir: user-data-salesforce]
    Browser1 --> Mode1{Modo?}
    
    Mode1 -->|Manual| Window1A[📍 Ventana Visible<br/>Manual Login]
    Mode1 -->|Supervisado| Window1B[📍 Ventana Centrada<br/>250,50]
    Mode1 -->|Automático| Window1C[📍 Ventana Oculta<br/>-2400,-2400]
    
    Window1A --> Nav1[🔗 Navegar a Salesforce]
    Window1B --> Nav1
    Window1C --> Nav1
    
    Nav1 --> Auth1{Necesita<br/>Login?}
    Auth1 -->|Sí| AutoLogin[🔐 attemptAutoLogin<br/>Introduce email]
    Auth1 -->|No| Dashboard[✅ Ya autenticado]
    AutoLogin --> Wait1
    Dashboard --> Wait1
    
    Wait1[⏱️ Esperar 5s<br/>DELAYS.LONG] --> Analytics[📊 Acceder a Analytics]
    
    Analytics --> ClickMV[👆 Click 'Mis vistas']
    ClickMV --> ClickPanel[👆 Click 'Paneles']
    ClickPanel --> Scroll[📜 Scroll al final]
    Scroll --> WaitTable[⏳ Esperar 30s<br/>Carga de tabla]
    
    WaitTable --> Download[⬇️ downloadCurrentTable]
    Download --> FindBtn[🔍 Buscar botón acciones]
    FindBtn --> MenuDL[📋 Click 'Descargar']
    MenuDL --> ClickExcel[📄 Click 'Excel']
    
    ClickExcel --> WaitDL[⏱️ Esperar 5s]
    WaitDL --> SaveSession1[💾 saveSessionData<br/>Cookies + Storage]
    
    SaveSession1 --> ProcessFile[📁 Buscar archivo<br/>Copy_of_TECH*.xlsx]
    ProcessFile --> Rename[✏️ Renombrar a<br/>telemetry_YYYYMMDD_HHMMSS.xlsx]
    Rename --> Track1[📝 Guardar path en<br/>last_downloaded_file.txt]
    
    Track1 --> Step2[🔍 PASO 2/4<br/>validate_excel.js]
    
    %% Paso 2: Validate
    Step2 --> ReadFile[📖 Leer archivo Excel]
    ReadFile --> CheckSheets{Validar<br/>Hojas}
    CheckSheets -->|Error| ValidationError[❌ Error: Hojas faltantes]
    CheckSheets -->|OK| CheckColumns[✓ Validar Columnas]
    CheckColumns -->|Error| ValidationError
    CheckColumns -->|OK| CheckData[✓ Validar Datos]
    CheckData -->|Error| ValidationError
    CheckData -->|OK| ValidationOK[✅ Validación exitosa]
    
    ValidationError --> End1([❌ Fin con error])
    ValidationOK --> Step3[📤 PASO 3/4<br/>upload_sp_telemetry.js]
    
    %% Paso 3: Upload
    Step3 --> Browser2[🌐 Iniciar Browser<br/>userDataDir: user-data-sharepoint]
    Browser2 --> Mode2{Modo?}
    
    Mode2 -->|Manual| Window2A[📍 Ventana Visible]
    Mode2 -->|Supervisado| Window2B[📍 Ventana Centrada]
    Mode2 -->|Automático| Window2C[📍 Ventana Oculta]
    
    Window2A --> Nav2[🔗 Navegar a SharePoint]
    Window2B --> Nav2
    Window2C --> Nav2
    
    Nav2 --> Wait2[⏱️ Esperar 10s]
    Wait2 --> SaveSession2[💾 saveSessionData]
    SaveSession2 --> UploadClick[👆 Click 'Cargar']
    
    UploadClick --> UploadFiles[👆 Click 'Archivos']
    UploadFiles --> Python[🐍 Lanzar upload.pyw<br/>Manejar dialog nativo]
    Python --> WaitUpload[⏳ Esperar 15s]
    WaitUpload --> SaveSession3[💾 saveSessionData]
    
    SaveSession3 --> CheckWS{Workspace<br/>especificado?}
    
    CheckWS -->|No| Success([✅ Pipeline Completo])
    CheckWS -->|Sí| Step4[🔄 PASO 4/4<br/>refresh_workspace.js]
    
    %% Paso 4: Refresh Workspace
    Step4 --> Browser3[🌐 Iniciar Browser<br/>userDataDir: user-data-workspace]
    Browser3 --> SelectWS{Workspace}
    
    SelectWS -->|kpis| URLKPIS[🔗 URL KPIS]
    SelectWS -->|defensa| URLDEF[🔗 URL Defensa]
    SelectWS -->|sectores| URLSEC[🔗 URL Sectores]
    
    URLKPIS --> NavWS[🔗 Navegar a Power BI]
    URLDEF --> NavWS
    URLSEC --> NavWS
    
    NavWS --> AuthWS{Necesita<br/>Login?}
    AuthWS -->|Sí| LoginWS[🔐 Completar Login]
    AuthWS -->|No| DatasetWS
    LoginWS --> DatasetWS[📊 Buscar Dataset]
    
    DatasetWS --> RefreshWS[🔄 Click Refresh]
    RefreshWS --> WaitRefresh[⏳ Esperar confirmación]
    WaitRefresh --> SaveSessionWS[💾 saveSessionData]
    
    SaveSessionWS --> Success
    
    %% Estilos
    classDef processClass fill:#667eea,stroke:#333,stroke-width:2px,color:#fff
    classDef decisionClass fill:#f093fb,stroke:#333,stroke-width:2px,color:#fff
    classDef successClass fill:#4facfe,stroke:#333,stroke-width:3px,color:#fff
    classDef errorClass fill:#fa709a,stroke:#333,stroke-width:2px,color:#fff
    classDef dataClass fill:#ffecd2,stroke:#333,stroke-width:2px,color:#333
    
    class Step1,Step2,Step3,Step4,Download,UploadClick,RefreshWS processClass
    class Mode1,Mode2,CheckWS,SelectWS,Auth1,AuthWS,CheckSheets decisionClass
    class Success successClass
    class End1,ValidationError errorClass
    class SaveSession1,SaveSession2,SaveSession3,SaveSessionWS,Track1 dataClass
```

## 📦 Módulos de Soporte (lib/)

```mermaid
graph LR
    Main[📜 Scripts Principales] --> Lib{lib/}
    
    Lib --> Constants[📋 constants.js<br/>Configuración<br/>Delays<br/>Selectores]
    Lib --> SessionMgr[💾 session-manager.js<br/>saveSessionData<br/>loadSessionData<br/>clearSessionData]
    Lib --> FileUtils[📁 file-utils.js<br/>getLatestFile<br/>renameFile<br/>saveTracking]
    Lib --> SFLogin[🔐 salesforce-login.js<br/>needsLogin<br/>attemptAutoLogin]
    Lib --> SFNav[🧭 salesforce-navigation.js<br/>waitForAnalytics<br/>clickButton<br/>scrollPanel]
    Lib --> SFDown[⬇️ salesforce-downloader.js<br/>downloadCurrentTable<br/>clickActionButton]
    Lib --> AuthHandler[🔑 auth-handler.js<br/>handlePopupLogin<br/>fillEmailField]
    
    Constants -.->|usa| Main
    SessionMgr -.->|usa| Main
    FileUtils -.->|usa| Main
    SFLogin -.->|usa| Main
    SFNav -.->|usa| Main
    SFDown -.->|usa| Main
    AuthHandler -.->|usa| SFDown
    
    classDef moduleClass fill:#a8e6cf,stroke:#333,stroke-width:2px,color:#333
    class Constants,SessionMgr,FileUtils,SFLogin,SFNav,SFDown,AuthHandler moduleClass
```

## 🎯 Modos de Ejecución

```mermaid
graph TD
    Exec([⚡ Ejecución]) --> ModeChoice{Seleccionar Modo}
    
    ModeChoice -->|Sin flags| Auto[🤖 Modo Automático<br/>Sin interacción<br/>Ventana oculta<br/>5s espera]
    ModeChoice -->|--supervised| Sup[👀 Modo Supervisado<br/>Ventana visible<br/>Centrada en pantalla<br/>5s espera]
    ModeChoice -->|--manual-login| Man[👤 Modo Manual<br/>Ventana visible<br/>5s para login<br/>Guarda credenciales]
    
    Auto --> UserDir1[📂 userDataDir<br/>Carga automática]
    Sup --> UserDir2[📂 userDataDir<br/>Carga automática]
    Man --> UserDir3[📂 userDataDir<br/>Carga automática]
    
    UserDir1 --> Flow[🔄 Flujo del Pipeline]
    UserDir2 --> Flow
    UserDir3 --> Flow
    
    classDef autoClass fill:#ffeaa7,stroke:#333,stroke-width:2px,color:#333
    classDef supClass fill:#74b9ff,stroke:#333,stroke-width:2px,color:#333
    classDef manClass fill:#a29bfe,stroke:#333,stroke-width:2px,color:#333
    
    class Auto autoClass
    class Sup supClass
    class Man manClass
```

## 🗂️ Estructura de Datos de Sesión

```mermaid
graph TB
    Session[💾 Datos de Sesión] --> SF[Salesforce]
    Session --> SP[SharePoint]
    Session --> WS[Workspace]
    
    SF --> SFCookies[📄 cookies_salesforce.json]
    SF --> SFStorage[📄 storage_salesforce.json]
    SF --> SFUserData[📁 user-data-salesforce/]
    
    SP --> SPCookies[📄 cookies_sharepoint.json]
    SP --> SPStorage[📄 storage_sharepoint.json]
    SP --> SPUserData[📁 user-data-sharepoint/]
    
    WS --> WSCookies[📄 cookies_workspace.json]
    WS --> WSStorage[📄 storage_workspace.json]
    WS --> WSUserData[📁 user-data-workspace/]
    
    SFCookies -.->|contiene| Cookies1[🍪 Cookies HTTP]
    SFStorage -.->|contiene| LS1[💿 localStorage]
    SFStorage -.->|contiene| SS1[💿 sessionStorage]
    SFUserData -.->|contiene| Cache1[🗄️ Cache del navegador<br/>Credentials<br/>Tokens]
    
    classDef fileClass fill:#ffecd2,stroke:#333,stroke-width:1px,color:#333
    classDef dirClass fill:#fcb69f,stroke:#333,stroke-width:2px,color:#333
    
    class SFCookies,SFStorage,SPCookies,SPStorage,WSCookies,WSStorage fileClass
    class SFUserData,SPUserData,WSUserData dirClass
```

## 🚀 Comandos de Ejecución

### Pipeline Completo
```bash
# Modo automático (sin ventanas visibles)
node run_full_pipeline.js

# Modo supervisado (ventana visible)
node run_full_pipeline.js --supervised

# Modo manual (para actualizar credenciales)
node run_full_pipeline.js --manual-login

# Con actualización de workspace
node run_full_pipeline.js --workspace kpis
node run_full_pipeline.js --supervised --workspace defensa
```

### Scripts Individuales
```bash
# Solo descargar
node download_telemetry.js
node download_telemetry.js --supervised
node download_telemetry.js --manual-login

# Solo validar
node validate_excel.js

# Solo subir
node upload_sp_telemetry.js
node upload_sp_telemetry.js --supervised

# Solo actualizar workspace
node refresh_workspace.js --workspace kpis
node refresh_workspace.js --workspace defensa --supervised
```

## 📊 Flujo de Datos

```mermaid
sequenceDiagram
    participant User as 👤 Usuario
    participant Pipeline as 🔄 Pipeline
    participant SF as 🔵 Salesforce
    participant File as 📁 Sistema Archivos
    participant SP as 🟢 SharePoint
    participant PBI as 📊 Power BI
    
    User->>Pipeline: Ejecutar pipeline
    Pipeline->>SF: 1. Login + Navegar
    SF-->>Pipeline: Dashboard cargado
    Pipeline->>SF: 2. Seleccionar vista/panel
    SF-->>Pipeline: Tabla mostrada
    Pipeline->>SF: 3. Descargar Excel
    SF-->>File: Copy_of_TECH*.xlsx
    File-->>Pipeline: Archivo descargado
    
    Pipeline->>File: 4. Renombrar archivo
    File-->>Pipeline: telemetry_YYYYMMDD.xlsx
    
    Pipeline->>File: 5. Validar Excel
    File-->>Pipeline: ✅ Validación OK
    
    Pipeline->>SP: 6. Login + Upload
    Pipeline->>File: Leer archivo
    File-->>Pipeline: Datos del archivo
    Pipeline->>SP: Subir archivo
    SP-->>Pipeline: ✅ Upload completo
    
    alt Workspace especificado
        Pipeline->>PBI: 7. Login + Refresh
        PBI-->>Pipeline: ✅ Dataset actualizado
    end
    
    Pipeline-->>User: ✅ Pipeline completado
```

## 🔒 Gestión de Credenciales

```mermaid
graph TD
    Start([Inicio]) --> CheckMode{Modo?}
    
    CheckMode -->|Manual Login| Clear[🗑️ clearSessionData<br/>Limpiar todo]
    CheckMode -->|Auto/Supervisado| Load[📥 Usar userDataDir<br/>Carga automática]
    
    Clear --> Fresh[✨ Sesión nueva<br/>Login manual]
    Load --> Reuse[♻️ Reusar sesión<br/>Sin login]
    
    Fresh --> Login[🔐 Usuario completa login]
    Reuse --> Check{Sesión<br/>válida?}
    
    Check -->|Sí| Continue[➡️ Continuar]
    Check -->|No| NeedsAuth[🔐 Requiere auth]
    
    Login --> Save[💾 saveSessionData]
    NeedsAuth --> AutoFill[📝 attemptAutoLogin<br/>Rellenar email]
    
    Save --> Continue
    AutoFill --> UserAuth[👤 Usuario completa auth]
    UserAuth --> Save
    
    Continue --> End([✅ Fin])
    
    classDef clearClass fill:#fa709a,stroke:#333,stroke-width:2px,color:#fff
    classDef saveClass fill:#4facfe,stroke:#333,stroke-width:2px,color:#fff
    
    class Clear clearClass
    class Save saveClass
```

---

**Leyenda:**
- 🔵 Salesforce Analytics
- 🟢 SharePoint
- 📊 Power BI
- 💾 Almacenamiento de sesión
- 🔐 Autenticación
- 📁 Sistema de archivos
- ⏱️ Esperas/Delays
