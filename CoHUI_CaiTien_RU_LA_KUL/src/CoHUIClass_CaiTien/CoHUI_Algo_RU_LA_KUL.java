package CoHUIClass_CaiTien;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryPoolMXBean;
import java.lang.management.MemoryType;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class CoHUI_Algo_RU_LA_KUL {
	Dataset dataset;
	int minUtil;
	float minCor;
    int[] oldNameToNewNames;
    int[] newNamesToOldNames;
    int newItemCount;
    int HUIcount;
    int transactionCount;
    long startTimestamp;
	long endTimestamp;
	ItemSets CoHUIs;
	List<Integer> Ikeep;
	List<Integer> Support_Ikeep;
	List<Integer> Utility_Ikeep;
	
	public CoHUI_Algo_RU_LA_KUL()
	{
		Ikeep=new ArrayList<Integer>();
		CoHUIs=new ItemSets("CoHUI");
		Support_Ikeep=new ArrayList<Integer>();
		Utility_Ikeep=new ArrayList<Integer>();
	}
	
	public long[] runCoHUI(String inputPath, int maximumTransactionCount, int minUtil, float minCor) throws IOException
	{
		startTimestamp = System.currentTimeMillis();
		this.minUtil=minUtil;
		this.minCor=minCor;		
		dataset = new Dataset(inputPath, maximumTransactionCount);		
		int[] twu=new int[dataset.getMaxItem() + 1];
		int[] support=new int[dataset.getMaxItem() + 1];
		int[] utility =new int[dataset.getMaxItem() + 1];
		initTWU_Support(twu, support, utility, dataset);
		
//		Itemtokeep all item in dataset
		for(int j=1; j< twu.length;j++) {
			if(twu[j]>=minUtil)
			{
				Ikeep.add(j);//itemsToKeep chinh la Ikeep
				Support_Ikeep.add(support[j]);
				Utility_Ikeep.add(utility[j]);
			}
		}
//		Sort all item to support accending	
		insertionSort(Ikeep, support);
		sortSupport_Utility(Support_Ikeep, Utility_Ikeep);		
		oldNameToNewNames = new int[dataset.getMaxItem()+1];
		newNamesToOldNames = new int[dataset.getMaxItem()+1];
		int currentName = 1;
		for (int j=0; j< Ikeep.size(); j++)
		{
			int item = Ikeep.get(j);
			oldNameToNewNames[item] = currentName;
			newNamesToOldNames[currentName] = item;
			Ikeep.set(j, currentName);
			currentName++;
		}
						
		for(int i=0; i< dataset.getTransactions().size();i++)
    	{
    		Transaction transaction  = dataset.getTransactions().get(i);
    		transaction.removeUnpromisingItems(oldNameToNewNames);
    	}
		newItemCount = Ikeep.size(); 				
//		System.out.println(dataset.toString());		
//		Bắt đầu thuật toán
//		==================================================================
		for(int i=0;i<Ikeep.size();i++)
		{
			if(Utility_Ikeep.get(i)>=minUtil)
			{
				ItemSet ItemsetCoHUI=new ItemSet(new int[] {i+1}, (double)Utility_Ikeep.get(i),1.0f);								
				CoHUIs.addItemset(ItemsetCoHUI, 1);	
			}				
			int X=Ikeep.get(i);
			int uX=Utility_Ikeep.get(i);					
			Dataset dbProject=new Dataset();
			int ruX=0;
			for(Transaction tran:dataset.transactions)
			{
				int ru=tran.transactionUtility;
				int j=0;
				while(j<tran.items.length && tran.items[j]<X)
				{
					ru-=tran.utilities[j];
					j++;
				}
				if(j==tran.items.length || tran.items[j]>X)
					continue;
				else //TranItem[j]=X va j<tranItems.length
				{
//					Tinh Project DB
					if(j<tran.items.length)//if(j<tranItems.length-1)
					{
						ru-=tran.utilities[j];
						Transaction newtran=new Transaction(Arrays.copyOfRange(tran.items, j+1,tran.items.length), 
									Arrays.copyOfRange(tran.utilities, j+1,tran.items.length), ru);
						newtran.Uprefix=tran.utilities[j];
						dbProject.add(newtran);
						ruX+=ru;
					}
				}
			}
			//Da tinh xong projectItem				
			ProjectExplore(new int[] {X}, uX, ruX, 1, Support_Ikeep.get(i), dbProject, 1);			
		}
		endTimestamp = System.currentTimeMillis();
		long[] rs=new long[3];
		rs[0]=endTimestamp - startTimestamp;
		rs[1]=getMemoryUsed();
		rs[2]=CoHUIs.getItemsetsCount();
		return rs;
	}
	
	public void ProjectExplore(int[] X, int uX, int ruX, float kulcX, int supportX, Dataset dbProjectX, int k) 
	{
//		co X={1}, ProjectDB(X), k: chieu dai cua X	
		for(int i=k;i<Ikeep.size();i++)
		{		
			int supportX_=0;
			int itemRight=Ikeep.get(i);
			int[] X_=new int[k+1]; 
			for(int t=0;t<X.length;t++)
				X_[t]=X[t];
			X_[k]=itemRight;//Tinh duoc X_={1,2}
			Dataset dbProject=new Dataset();		
			int uX_=uX; //Tinh U cua X_	
			int ruX_=0;	
			int uLA=uX+ruX;
			float phanso=(kulcX*(float)k/(float)(supportX))+1.0f/(float)Support_Ikeep.get(itemRight-1);
			float kulc_temp=kulcX;
			int sup_temp=supportX;
			for(Transaction tran: dbProjectX.getTransactions())
			{
				int ru_temp=tran.transactionUtility;
				int j=0;
				while(j<tran.items.length && tran.items[j]<itemRight)
				{
					ru_temp-=tran.utilities[j];
					j++;
				}
				if(j==tran.items.length || tran.items[j]> itemRight)
				{
					uX_-=tran.Uprefix;
					uLA=uLA-tran.Uprefix-tran.transactionUtility;
					if(uLA<minUtil)
						break;
					sup_temp=sup_temp-1;
					kulc_temp=((float)sup_temp/(float)(k+1))*phanso;
					if(kulc_temp<minCor)
						break;
					continue;
				}
				else //TranItem[t]=itemRight va t<tranItems.length
				{
//					Tinh tiep uX_
					uX_+=tran.utilities[j];
					ru_temp-=tran.utilities[j];
					supportX_++;
//					Tinh Project DB
					if(j<tran.items.length)//if(j<tranItems.length-1)
					{
						Transaction newtran=new Transaction(Arrays.copyOfRange(tran.items, j+1,tran.items.length), 
										Arrays.copyOfRange(tran.utilities, j+1,tran.items.length), 
										ru_temp);
						newtran.Uprefix=tran.Uprefix+tran.utilities[j];						
						dbProject.add(newtran);		
						ruX_+=ru_temp;
					}
				}
			}
			
			if(supportX_>0)//Mot so truong hop support =0 do X_ko co trong tran nao cua dataset truoc do
			{
				float kulcX_=0.0f;
				for(int j=0;j<k+1;j++)
					kulcX_+=1.0f/(float)Support_Ikeep.get(X_[j]-1);
				kulcX_*=((float)supportX_/(float)(k+1));
				//kulcX_=((float)supportX_/(float)(k+1))*((kulcX*(float)k/(float)(supportX))+1.0f/(float)Support_Ikeep.get(X_[k]-1));
				
				if(kulcX_>=minCor)
				{
					if(uX_>=minUtil)
					{
						ItemSet ItemsetCoHUI=new ItemSet(X_, uX_,kulcX_); //Thay doi lai 1.0f. cai nay la kulc								
						CoHUIs.addItemset(ItemsetCoHUI, k+1);	
					}
					//if(twuX_>=minUtil)
					if(uX_+ruX_>=minUtil)
					{						
						ProjectExplore(X_,uX_,ruX_,kulcX_,supportX_,dbProject,X_.length);
					}
				}
			}
		}
	}
	
	public void sortSupport_Utility(List<Integer> supportCHU, List<Integer> utilityCHU)
	{
		for(int j=1; j< supportCHU.size(); j++)
		{
			int itemJ = supportCHU.get(j);
			int itemJ_=utilityCHU.get(j);
			int i = j - 1;
			for(; i>=0 && (supportCHU.get(i)  > itemJ); i--)
			{
				supportCHU.set(i+1, supportCHU.get(i));
				utilityCHU.set(i+1, utilityCHU.get(i));
			}			
			supportCHU.set(i+1, itemJ);
			utilityCHU.set(i+1, itemJ_);
		}
	}
	
	public void insertionSort(List<Integer> items, int [] support)
	{	
		for(int j=1; j< items.size(); j++){
			Integer itemJ = items.get(j);
			int i = j - 1;
			Integer itemI = items.get(i);
			int comparison = support[itemI] - support[itemJ];
			// if the twu is equal, we use the lexicographical order to decide whether i is greater
			// than j or not.
			if(comparison == 0){
				comparison = itemI - itemJ;
			}
			
			while(comparison > 0){
				items.set(i+1, itemI);
				i--;
				if(i<0){
					break;
				}
				
				itemI = items.get(i);
				comparison = support[itemI] - support[itemJ];
				// if the twu is equal, we use the lexicographical order to decide whether i is greater
				// than j or not.
				if(comparison == 0){
					comparison = itemI - itemJ;
				}
			}
			items.set(i+1,itemJ);
		}
	}
	
	public void initTWU_Support(int[] twu, int[] support, int[] utility, Dataset dataset) 
	{
		for (Transaction transaction : dataset.getTransactions()) 
		{
			int[] items=transaction.getItems();
			int[] u=transaction.getUtilities();
			for(int i=0;i<items.length;i++)
			{
				twu[items[i]] += transaction.transactionUtility;
				support[items[i]]++;
				utility[items[i]]+=u[i];
			}
		}
	}
	
	public long getMemoryUsed()
	{
		List<MemoryPoolMXBean> pools = ManagementFactory.getMemoryPoolMXBeans();
		double total = 0;
		for (MemoryPoolMXBean memoryPoolMXBean : pools) {
			if (memoryPoolMXBean.getType() == MemoryType.HEAP) {
				long peakUsed = memoryPoolMXBean.getPeakUsage().getUsed();				
				total = total + peakUsed;
			}
			memoryPoolMXBean.resetPeakUsage();
		}
		return Math.round(total/1024/1024);
	}
	
	public void ResetMemoryUsed()
	{
		List<MemoryPoolMXBean> pools = ManagementFactory.getMemoryPoolMXBeans();

		for (MemoryPoolMXBean memoryPoolMXBean : pools)
		{		
			memoryPoolMXBean.resetPeakUsage();
		}
	}
	
//	public void saveFileResult(String path)
//	{
//		CoHUI.saveFile(path);
//	}
	
//	public void printPeakHeapUsage()
//	{
//		try {
//	        List<MemoryPoolMXBean> pools = ManagementFactory.getMemoryPoolMXBeans();
//	        // we print the result in the console
//			double total = 0;
//			for (MemoryPoolMXBean memoryPoolMXBean : pools) {
//				if (memoryPoolMXBean.getType() == MemoryType.HEAP) {
//					long peakUsed = memoryPoolMXBean.getPeakUsage().getUsed();
//					System.out.println(String.format("Peak used for: %s is %.2f", memoryPoolMXBean.getName(), (double)peakUsed/1024/1024));
//					total = total + peakUsed;
//				}
//			}
//			System.out.println(String.format("Total heap peak used: %f MB", total/1024/1024));
//	 
//	   } catch (Throwable t) {
//	        System.err.println("Exception in agent: " + t);
//	   }
//	}
	
//	public void printResult(String DBName) 
//	{
//		CoHUI.printItemsets();
//		System.out.println();
//		System.out.println("----------------------------------");
//		System.out.println("    THUAT TOAN COHUI CAI TIEN");
//		System.out.println("----------------------------------");
//		System.out.println(" Database: "+DBName);
//		System.out.println(" Transaction count: "+dataset.getTransactions().size());
//		System.out.println(" Minutil: "+minUtil+"    Mincor: "+minCor);
//		System.out.println(" Total time ~: " + (endTimestamp - startTimestamp)	+ " ms");	
//		System.out.println(" CoHUI count: " + CoHUI.getItemsetsCount());
//		System.out.println("----------------------------------");
//	}
	
//	public void saveResults(String path, String DBName)
//	{	
//		try
//		{
//			File f = new File(path);
//			if (!f.exists()) 
//				f.createNewFile();
//			FileWriter fw = new FileWriter(f,true);
//			String result="\r\n------------------------------------------";
//			//Write times
//			result+="\r\n* CoHUI count:"+CoHUI.getItemsetsCount()+
//					"\r\n* MinUtil:"+minUtil+
//					"\r\n* MinCor:"+minCor+
//					"\r\n    => Total times~:"+ (endTimestamp - startTimestamp)	+ " ms";
//
//			//Write memory
//			List<MemoryPoolMXBean> pools = ManagementFactory.getMemoryPoolMXBeans();
//			double total = 0;
//			for (MemoryPoolMXBean memoryPoolMXBean : pools) {
//				if (memoryPoolMXBean.getType() == MemoryType.HEAP) {
//					long peakUsed = memoryPoolMXBean.getPeakUsage().getUsed();
//					//System.out.println(String.format("Peak used for: %s is %.2f", memoryPoolMXBean.getName(), (double)peakUsed/1024/1024));
//					total = total + peakUsed;
//				}
//			}
//			result+="\r\n    => Total heap peak used:"+Math.round(total/1024/1024)+" MB";
//			
//			fw.write(result);
//			fw.close();
//		}catch(Exception e){}
//	}
	
//	public void saveResultMemory()
//	{
//		try {
//	        List<MemoryPoolMXBean> pools = ManagementFactory.getMemoryPoolMXBeans();
//			double total = 0;
//			for (MemoryPoolMXBean memoryPoolMXBean : pools) {
//				if (memoryPoolMXBean.getType() == MemoryType.HEAP) {
//					long peakUsed = memoryPoolMXBean.getPeakUsage().getUsed();
//					//System.out.println(String.format("Peak used for: %s is %.2f", memoryPoolMXBean.getName(), (double)peakUsed/1024/1024));
//					total = total + peakUsed;
//				}
//			}
//			//System.out.println(String.format("Total heap peak used: %f MB", total/1024/1024));
//			
//	   } catch (Throwable t) {
//	        System.err.println("Exception in agent: " + t);
//	   }		
//	}
}
