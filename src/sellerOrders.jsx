import Card from './components/seller_card';
import Navi from './components/sellerNav';
function SellerTrack(prop){
    return(
       <>
       <Navi></Navi>
      <Card description="This stuff" price={100} date="03/04/2025" OrderID="ab123" Img="/pexels-nietjuhart-776656.jpg"></Card>
      <Card description="This stuff" price={10650} date="03/04/2025" OrderID="ab1234" Img="/pexels-karolina-grabowska-5706227.jpg"></Card>
      <Card description="This stuff" price={1600} date="03/04/2025" OrderID="ab1235" Img="/pexels-heftiba-1194397.jpg"></Card>
      <Card description="This stuff" price={1060} date="03/04/2025" OrderID="ab1236" Img="/pexels-lina-1813503.jpg"></Card>
       </> 
    );
}
export default SellerTrack;