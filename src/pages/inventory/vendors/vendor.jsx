import { useEffect, useState } from "react";
import { formatRupiah } from "../../../utils/format";
import { createProduct, searchProduct } from "../../../services/productService";
import { toast } from "react-toastify";
import { validateBarcode } from "../../../utils/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import PaginationTableNoLink from "../../../components/globals/pagination";
import { createVendor, searchVendor } from "../../../services/vendorService";

export default function VendorPage() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const page = searchParams[0].get("page") || 1;
  const paramsName = searchParams[0].get("name") || undefined;
  const paramsPhone = searchParams[0].get("phone") || undefined;
  const [selectedItem, setSelectedItem] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [refresh, setRefresh] = useState("");
  const [currentPage, setCurrentPage] = useState(parseInt(page));
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState({});
  const [infoMessage, setInfoMessage] = useState(
    "Klik vendor atau laporan untuk melihat demo informasi inventory.",
  );

  const checkError = () => {
    const tempError = {};
    if (!name.trim()) tempError.name = "Nama vendor harus diisi.";
    if (!phone.trim()) tempError.phone = "Nomor telepon vendor harus diisi.";
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  const loadData = async () => {
    const { data, totalPages, error } = await searchVendor({
      page,
      name: paramsName,
      phone: paramsPhone,
    });
    if (error.length > 0) {
      toast.error(error);
    } else {
      // setTotalPages(totalPages);
      setVendors(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVendor = async () => {
    console.log(phone, name)
    const { data, error } = await createVendor({
      name,
      phone,
    });
    if (error.length > 0) {
      toast.error(error);
    } else {
      toast.success("Vendor berhasil ditambahkan");
      setName("");
      setPhone("");
      loadData();
      setRefresh(new Date().toISOString());
    }
  };

  return (
    <div key={refresh}>
      <section className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
              Master Vendor
            </p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">
              Daftar Vendor
            </h3>
          </div>
          <button
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            type="button"
          >
            Tambah Vendor
          </button>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <table className="w-full min-w-130 text-left text-sm text-gray-600 overflow-x-auto rounded-4xl border border-orange-100 bg-white">
              <thead>
                <tr className="border-b border-orange-100 text-gray-500">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">No Telepon</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((item) => (
                  <tr
                    key={item.id}
                    role="button"
                    onClick={() => setSelectedItem(item)}
                    className={`border-b border-orange-50 hover:bg-orange-50/50 transition duration-150 ${
                      selectedItem?.id === item.id ? "bg-orange-50" : ""
                    } cursor-pointer`}
                  >
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationTableNoLink
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-[32px] border border-orange-100 bg-orange-50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Demo Inventory
              </p>
              <p className="mt-3 text-sm text-gray-600">{infoMessage}</p>
            </div>

            <div className="rounded-[32px] border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Detail Vendor
              </p>
              {selectedItem ? (
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedItem.name}
                    </p>
                    <p className="text-gray-500">
                      Nama Vendor: {selectedItem.name}
                    </p>
                    <p className="text-gray-500">
                      Nomor Telepon: {selectedItem.phone}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/inventory/vendors/edit/${selectedItem.id}`,
                          { state: { vendor: selectedItem } },
                        )
                      }
                      className="rounded-full cursor-pointer border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                    >
                      Return
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Pilih vendor untuk melihat detail dan aksi inventory.
                </p>
              )}
            </div>

            <div className="rounded-[32px] border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Tambah Vendor
              </p>
              <div className="mt-4 space-y-4 text-sm text-gray-700">
                <label className="block">
                  <span className="text-gray-600">Nama Vendor</span>
                  <input
                    defaultValue={name}
                    onChange={(e) => {
                      setError((prev) => {
                        if (prev["name"]) delete prev["name"];
                        return { ...prev };
                      });
                      setName(e.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-600">Nomor Telepon</span>
                  <input
                    defaultValue={phone}
                    onChange={(e) => {
                      setError((prev) => {
                        if (prev["phone"]) delete prev["phone"];
                        return { ...prev };
                      });
                      setPhone(e.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (checkError()) {
                      handleCreateVendor();
                    }
                  }}
                  className="w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Tambah Vendor Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
