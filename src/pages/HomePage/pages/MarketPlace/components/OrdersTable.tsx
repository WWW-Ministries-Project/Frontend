import { useMemo } from "react";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { ColumnDef } from "@tanstack/react-table";

interface IOrders {
  name: string;
  location: string;
  contact: string;
  product_name: string;
  type: string;
  category: string;
  color: string;
  size: string;
  quantity: string;
  price: number;
  total: number;
}

const orders: IOrders[] = [
  {
    name: "John Doe",
    location: "Accra",
    contact: "0551234567",
    product_name: "Casual T-shirt",
    type: "T-shirt",
    category: "Apparel",
    color: "Black",
    size: "M",
    quantity: "2",
    price: 20,
    total: 40,
  },
  {
    name: "Jane Smith",
    location: "Kumasi",
    contact: "0249876543",
    product_name: "Running Shoes",
    type: "Shoes",
    category: "Footwear",
    color: "Blue",
    size: "42",
    quantity: "1",
    price: 50,
    total: 50,
  },
  {
    name: "Kwame Nkrumah",
    location: "Cape Coast",
    contact: "0201112233",
    product_name: "Leather Wallet",
    type: "Wallet",
    category: "Fashion",
    color: "Brown",
    size: "One Size",
    quantity: "3",
    price: 30,
    total: 90,
  },
  {
    name: "Akosua Mensah",
    location: "Tamale",
    contact: "0502223344",
    product_name: "Smart Watch",
    type: "Watch",
    category: "Electronics",
    color: "Silver",
    size: "One Size",
    quantity: "1",
    price: 60,
    total: 60,
  },
  {
    name: "Yaw Boateng",
    location: "Takoradi",
    contact: "0273344556",
    product_name: "Bluetooth Speaker",
    type: "Speaker",
    category: "Audio",
    color: "Red",
    size: "Small",
    quantity: "2",
    price: 35,
    total: 70,
  },
  {
    name: "Ama Serwaa",
    location: "Sunyani",
    contact: "0266677889",
    product_name: "Wireless Headphones",
    type: "Headphones",
    category: "Audio",
    color: "White",
    size: "One Size",
    quantity: "1",
    price: 80,
    total: 80,
  },
  {
    name: "Kojo Antwi",
    location: "Tema",
    contact: "0209988776",
    product_name: "Gaming Mouse",
    type: "Mouse",
    category: "Accessories",
    color: "Black",
    size: "Standard",
    quantity: "1",
    price: 25,
    total: 25,
  },
  {
    name: "Linda Appiah",
    location: "Koforidua",
    contact: "0504455667",
    product_name: "Backpack",
    type: "Bag",
    category: "Travel",
    color: "Gray",
    size: "Large",
    quantity: "2",
    price: 40,
    total: 80,
  },
  {
    name: "Michael Owusu",
    location: "Accra",
    contact: "0543322110",
    product_name: "Casual T-shirt",
    type: "T-shirt",
    category: "Apparel",
    color: "White",
    size: "L",
    quantity: "1",
    price: 20,
    total: 20,
  },
  {
    name: "Esi Arhin",
    location: "Ho",
    contact: "0245566778",
    product_name: "Running Shoes",
    type: "Shoes",
    category: "Footwear",
    color: "Pink",
    size: "39",
    quantity: "2",
    price: 50,
    total: 100,
  },
  {
    name: "Nana Abena",
    location: "Techiman",
    contact: "0234567890",
    product_name: "Smart Watch",
    type: "Watch",
    category: "Electronics",
    color: "Gold",
    size: "One Size",
    quantity: "1",
    price: 60,
    total: 60,
  },
  {
    name: "Selorm Tetteh",
    location: "Tema",
    contact: "0572233445",
    product_name: "Leather Wallet",
    type: "Wallet",
    category: "Fashion",
    color: "Dark Brown",
    size: "One Size",
    quantity: "2",
    price: 30,
    total: 60,
  },
  {
    name: "Portia Yeboah",
    location: "Bolgatanga",
    contact: "0567890123",
    product_name: "Bluetooth Speaker",
    type: "Speaker",
    category: "Audio",
    color: "Blue",
    size: "Medium",
    quantity: "1",
    price: 35,
    total: 35,
  },
  {
    name: "Kwabena Asante",
    location: "Wa",
    contact: "0512345678",
    product_name: "Gaming Mouse",
    type: "Mouse",
    category: "Accessories",
    color: "Black",
    size: "Standard",
    quantity: "3",
    price: 25,
    total: 75,
  },
  {
    name: "Mariam Fuseini",
    location: "Tamale",
    contact: "0298765432",
    product_name: "Backpack",
    type: "Bag",
    category: "Travel",
    color: "Green",
    size: "Large",
    quantity: "1",
    price: 40,
    total: 40,
  },
];

export default function OrdersTable() {
 const tableColumns: ColumnDef<IOrders>[] = useMemo(() => {
    const keys: (keyof IOrders)[] = [
      "name",
      "location",
      "contact",
      "product_name",
      "type",
      "category",
      "color",
      "size",
      "quantity",
      "price",
      "total",
    ];

    return keys.map((key) => {
      if (key === "name") {
        return {
          header: "Name",
          accessorKey: key,
          cell: ({ row }) => <div>{row.original.name}</div>,
        };
      }

      return {
        header: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        accessorKey: key,
      };
    });
  }, []);

  return (
    <div>
      <TableComponent
        columns={tableColumns}
        data={orders}
        displayedCount={10}
      />
    </div>
  );
}
