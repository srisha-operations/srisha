import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Eye } from "lucide-react";
import { listOrders, updateOrderStatus, deleteOrder, Order } from "@/services/orders";
import { useToast } from "@/hooks/use-toast";

const OrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const { toast } = useToast();

  const pageSize = 10;

  useEffect(() => {
    loadOrders();
  }, [statusFilter, searchQuery, currentPage]);

  const loadOrders = async () => {
    setLoading(true);
    const { orders: data, total } = await listOrders(
      {
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      },
      pageSize,
      currentPage * pageSize
    );
    setOrders(data);
    setTotalOrders(total);
    setLoading(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(orderId, newStatus as Order["status"]);
    if (result.success) {
      toast({ title: "Order status updated", duration: 2000 });
      loadOrders();
    } else {
      toast({ title: `Error: ${result.error}`, duration: 3000 });
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    const result = await deleteOrder(orderId);
    if (result.success) {
      toast({ title: "Order deleted", duration: 2000 });
      loadOrders();
    } else {
      toast({ title: `Error: ${result.error}`, duration: 3000 });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusColors: Record<Order["status"], string> = {
    pending_payment: "bg-yellow-100 text-yellow-800",
    pending_approval: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-cyan-100 text-cyan-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const pageCount = Math.ceil(totalOrders / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-tenor text-foreground mb-1">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage customer orders and track shipments</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Search</label>
            <Input
              placeholder="Order #, email, or customer name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              className="font-lato"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Filter by Status</label>
            <Select value={statusFilter} onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(0);
            }}>
              <SelectTrigger className="font-lato">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-tenor">Order #</TableHead>
                  <TableHead className="font-tenor">Customer</TableHead>
                  <TableHead className="font-tenor">Email</TableHead>
                  <TableHead className="font-tenor">Amount</TableHead>
                  <TableHead className="font-tenor">Status</TableHead>
                  <TableHead className="font-tenor">Date</TableHead>
                  <TableHead className="font-tenor text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-b border-border hover:bg-slate-50">
                    <TableCell className="font-lato font-medium">{order.order_number}</TableCell>
                    <TableCell className="font-lato">{order.customer_name}</TableCell>
                    <TableCell className="font-lato text-xs text-muted-foreground">{order.customer_email}</TableCell>
                    <TableCell className="font-lato">
                      ₹{(order.total_amount || order.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                        <SelectTrigger className={`w-40 text-xs font-lato ${statusColors[order.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending_payment">Pending Payment</SelectItem>
                          <SelectItem value="pending_approval">Pending Approval</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-lato text-sm">{formatDate(order.created_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(order.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="font-lato"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground font-lato">
            Page {currentPage + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="font-lato"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
