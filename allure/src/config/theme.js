/**
 * Configuração e tokens visuais centralizados do Allure Design System.
 * Permite alterar os temas e variantes em um só lugar.
 */

export const BUTTON_VARIANTS = {
  primary:
    "!bg-gradient-to-br from-[var(--cor-primaria)] to-[#a03c53] !text-white !border-none rounded-full shadow-[0_4px_12px_rgba(199,75,103,0.2)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(199,75,103,0.3)]",
  secondary:
    "!bg-slate-100 !text-slate-600 !border-none rounded-full hover:!bg-slate-200",
  danger:
    "!bg-red-500 !text-white !border-none rounded-full hover:!bg-red-600 shadow-sm",
  ghost:
    "!bg-transparent !text-slate-500 hover:!text-slate-800 hover:!bg-slate-100 !border-none shadow-none rounded-lg",
};

export const BUTTON_SIZES = {
  sm: "!px-6 !py-2.5 text-xs gap-2 min-h-[36px]",
  md: "!px-8 !py-3 text-sm sm:text-base gap-3 min-h-[44px]",
  lg: "!px-10 !py-4 text-base gap-3.5 min-h-[50px]",
  icon: "!p-2.5 rounded-lg",
};

export const MODAL_STYLES = {
  overlay:
    "fixed inset-0 !z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto",
  container:
    "bg-white rounded-3xl !p-[5px] shadow-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col relative border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200",
  header:
    "flex justify-between items-center pb-4 mb-5 border-b border-slate-100",
  title: "text-xl font-bold text-slate-800 tracking-tight",
  closeButton:
    "text-slate-400 hover:text-slate-600 transition-colors bg-slate-100/80 border-none cursor-pointer p-2 rounded-full hover:bg-slate-200 flex items-center justify-center ml-auto",
  body: "flex-1 space-y-5 text-slate-700",
};

export const FORM_STYLES = {
  group: "flex flex-col gap-2",
  label: "text-sm font-semibold text-slate-700 tracking-wide",
  input:
    "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[var(--cor-primaria)] focus:ring-2 focus:ring-[var(--cor-primaria)]/20 transition-all text-sm",
  select:
    "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[var(--cor-primaria)] focus:ring-2 focus:ring-[var(--cor-primaria)]/20 transition-all text-sm cursor-pointer",
  textarea:
    "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[var(--cor-primaria)] focus:ring-2 focus:ring-[var(--cor-primaria)]/20 transition-all text-sm min-h-[90px] resize-y",
  error: "text-red-500 text-xs font-medium flex items-center gap-1 mt-0.5",
  row: "grid grid-cols-1 sm:grid-cols-2 gap-5",
  actions:
    "flex items-center justify-end gap-3 !pt-6 !mt-6 !pb-4 border-t border-slate-100",
};
