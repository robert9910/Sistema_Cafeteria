export type OrderStatus = "pendiente" | "preparando" | "listo" | "entregado";
export type MovementType = "venta" | "reposicion" | "ajuste";

// Nota: estos son `type`, no `interface`. Un `interface` no recibe una firma
// de índice implícita, así que `Database["public"]` dejaría de cumplir el
// `GenericSchema` que espera supabase-js y `.rpc()`/`.from()` perderían el
// tipado (todo cae silenciosamente a `never`). Ver supabase-js #GenericSchema.

export type Product = {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  disponible: boolean;
  creado_en: string;
  actualizado_en: string;
};

export type Ingredient = {
  id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  umbral_minimo: number;
  creado_en: string;
  actualizado_en: string;
};

export type Recipe = {
  id: string;
  product_id: string;
  ingredient_id: string;
  cantidad: number;
};

export type Order = {
  id: string;
  mesa: number;
  estado: OrderStatus;
  total: number;
  creado_en: string;
  actualizado_en: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  cantidad: number;
  precio_unitario: number;
};

export type InventoryMovement = {
  id: string;
  ingredient_id: string;
  tipo: MovementType;
  cantidad: number;
  order_id: string | null;
  nota: string | null;
  creado_en: string;
};

export type StockAlert = {
  id: string;
  ingredient_id: string;
  mensaje: string;
  resuelto: boolean;
  creado_en: string;
  resuelto_en: string | null;
};

export type StaffUser = {
  id: string;
  nombre: string;
  rol: "staff" | "admin";
  creado_en: string;
};

export type ProductoMasVendido = {
  product_id: string;
  nombre: string;
  categoria: string;
  unidades_vendidas: number;
  ingresos: number;
};

export type HoraPico = {
  hora: number;
  pedidos: number;
};

export type InsumoMasConsumido = {
  ingredient_id: string;
  nombre: string;
  unidad: string;
  cantidad_consumida: number;
};

export type Database = {
  public: {
    Tables: {
      products: { Row: Product; Insert: never; Update: Partial<Product>; Relationships: [] };
      ingredients: { Row: Ingredient; Insert: never; Update: Partial<Ingredient>; Relationships: [] };
      recipes: { Row: Recipe; Insert: never; Update: never; Relationships: [] };
      orders: { Row: Order; Insert: never; Update: never; Relationships: [] };
      order_items: { Row: OrderItem; Insert: never; Update: never; Relationships: [] };
      inventory_movements: { Row: InventoryMovement; Insert: never; Update: never; Relationships: [] };
      stock_alerts: { Row: StockAlert; Insert: never; Update: Partial<StockAlert>; Relationships: [] };
      staff_users: { Row: StaffUser; Insert: never; Update: never; Relationships: [] };
    };
    Views: {
      v_productos_mas_vendidos: { Row: ProductoMasVendido; Relationships: [] };
      v_horas_pico: { Row: HoraPico; Relationships: [] };
      v_insumos_mas_consumidos: { Row: InsumoMasConsumido; Relationships: [] };
    };
    Functions: {
      fn_create_order: {
        Args: { p_mesa: number; p_items: { product_id: string; cantidad: number }[] };
        Returns: Order;
      };
      fn_update_order_status: {
        Args: { p_order_id: string; p_new_status: OrderStatus };
        Returns: Order;
      };
      fn_reponer_stock: {
        Args: { p_ingredient_id: string; p_cantidad: number; p_nota?: string | null };
        Returns: Ingredient;
      };
    };
  };
};
