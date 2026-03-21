package MainTest_CaiTien;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.LineNumberReader;

import CoHUIClass_CaiTien.CoHUI_Algo_NEW;
import CoHUIClass_CaiTien.CoHUI_Algo_RU_LA_KUL;
//import java.awt.Toolkit;

public class TestCoHUI_CaiTien_RU_LA_KUL {
	
public static void main(String[] args) throws IOException 
{
	String folderPath="Data/";//Folder chua database
	String filesave="Data/";
///////////////////////////////////////////////////////////////////////////////////////////////		
String DatabaseFile = folderPath+"/mushroom_utility.txt";
String fileResult=filesave+"/CoHUI_caitien_HMiner_DB.txt";
float[] mincor=new float[] {0.4f};
int[] minutil=new int[] {50000};

//	String[] DatabaseFile=new String[5];
//	DatabaseFile[0]=folderPath+"/chess_utility_spmf.txt";
//	DatabaseFile[1]=folderPath+"/mushroom_utility_SPMF.txt";
//	DatabaseFile[2]=folderPath+"/chainstore.txt";
//	DatabaseFile[3]=folderPath+"/accidents_utility_spmf.txt";
//	DatabaseFile[4]=folderPath+"/BMS_utility_spmf.txt";
//	
//	String[] fileResult=new String[5];
//	fileResult[0]=filesave+"/CoHUI_caitien_Chess.txt";
//	fileResult[1]=filesave+"/CoHUI_caitien_Mushroom.txt";
//	fileResult[2]=filesave+"/CoHUI_caitien_chainstore.txt";	
//	fileResult[3]=filesave+"/CoHUI_caitien_accidents.txt";	
//	fileResult[4]=filesave+"/CoHUI_caitien_BMS.txt";
//	
//	float[][] mincor=new float[5][];
//	mincor[0]=new float[] {0.81f, 0.82f, 0.83f};
//	mincor[1]=new float[] {0.42f, 0.44f, 0.46f};
//	mincor[2]=new float[] {0.1f, 0.15f, 0.2f};
//	mincor[3]=new float[] {0.55f, 0.6f, 0.65f};
//	mincor[4]=new float[] {0.1f, 0.15f, 0.2f};
//	
//	int[][] minutil=new int[5][];
//	minutil[0]=new int[] {350000,400000,450000,500000,550000};
//	minutil[1]=new int[] {40000,60000,80000,100000,120000};
//	minutil[2]=new int[] {700000,1000000,1300000,1600000,1900000};
//	minutil[3]=new int[] {22000000,24000000,26000000,28000000,30000000};
//	minutil[4]=new int[] {2100000,2150000,2200000,2250000,2300000};
///////////////////////////////////////////////////////////////////////////////////////////////		
//String DatabaseFile = "Data/accidents_utility.txt";
//String fileResult="Data/CoHUI_ouput.txt";
//float[] mincor=new float[] {0.68f};//{0.86f, 0.78f, 0.7f};
//int[] minutil=new int[] {28000};//{600000,500000,400000,300000,200000};
///////////////////////////////////////////////////////////////////////////////////////////////		
//String DatabaseFile = "Data/mushroom_utility.txt";
//String fileResult="Data/CoHUI_ouput.txt";
//float[] mincor=new float[] {0.4f};//{0.6f, 0.5f, 0.4f};
//int[] minutil=new int[] {50000};//{250000,200000,150000,100000,50000};
///////////////////////////////////////////////////////////////////////////////////////////////
//String DatabaseFile = folderPath+"/kosarak_utility_spmf.txt";
//String fileResult=filesave+"/CoHUI_caitien_kosarak.txt";	
//float[] mincor=new float[] {0.8f};//{0.8f, 0.7f, 0.6f};
//int[] minutil=new int[] {2500000};//{2500000,2400000,2300000,2200000,2100000};	
///////////////////////////////////////////////////////////////////////////////////////////////	
//String DatabaseFile = "Data/accidents_utility.txt";
//String fileResult="Data/CoHUI_ouput.txt";	
//float[] mincor=new float[] {0.62f};//{0.68f, 0.65f, 0.62f};
//int[] minutil=new int[] {16000000};//{28000000,24000000,20000000,16000000,12000000};
///////////////////////////////////////////////////////////////////////////////////////////////
//String DatabaseFile = folderPath+"/chainstore.txt";
//String fileResult=filesave+"/CoHUI_caitien_chainstore.txt";	
//float[] mincor=new float[] {0.2f};//{0.2f,{0.15f, 0.1f};
//int[] minutil=new int[] {1900000};//{1900000,1600000,1300000,1000000,700000};
///////////////////////////////////////////////////////////////////////////////////////////////	
//String DatabaseFile = "Data/connect_utility.txt";
//String fileResult="Data/CoHUI_ouput.txt";	
//float[] mincor=new float[] {0.75f};//{0.85f,0.8f,0.75f};
//int[] minutil=new int[] {34000000};//{34000000,33500000,33000000,32500000,32000000};
///////////////////////////////////////////////////////////////////////////////////////////////		
//	for(int i=0;i<5;i++)
//	{
		runAlgorithm(mincor, minutil, DatabaseFile,fileResult);	
		System.out.println("Finish CoHUI goc! ");	
		//Toolkit.getDefaultToolkit().beep();
//	}
}

public static void runAlgorithm(float[] arrayMincor, int[] arrayMinUtil, String inputPathDatabase, String fileResult)
{	
	int transactionCount=getTransactionCount(inputPathDatabase);
	String DBName=getDBName(inputPathDatabase);
	
	int row=arrayMincor.length;
	int column=arrayMinUtil.length;
	try {
		SaveHeaderToFile("Thuat toan CoHUI-Miner", fileResult, DBName, transactionCount);
		for(int i=0;i<row;i++)
		{
			long[][] result=new long[3][column];
			for(int j=0;j<column;j++)
			{
				//CoHUI_Algo_RU_LA_KUL algo=new CoHUI_Algo_RU_LA_KUL();
				CoHUI_Algo_NEW algo = new CoHUI_Algo_NEW();
				//algo.ResetMemoryUsed();
				long[] rs=algo.runCoHUI(inputPathDatabase, transactionCount, arrayMinUtil[j], arrayMincor[i]);
				printResult(rs);
				for(int t=0;t<rs.length;t++)
					result[t][j]=rs[t];
			}
			SaveToFile(fileResult, result,arrayMinUtil,arrayMincor[i]);
			System.out.println("Finished with micor="+arrayMincor[i]);
		}
		
	}catch (IOException e) {
		e.printStackTrace();
	}
}

public static void printResult(long[] rs) {
	System.out.println("=============  COHUI-MINER ALGORITHM===============");
	System.out.println(" Total time ~ " + rs[0] + " ms");
	System.out.println(" Memory ~ " + rs[1] + " MB");
	System.out.println(" CoHUI count : " + rs[2]); 
	System.out.println("===================================================");
}

public static void SaveHeaderToFile(String AlgorithmName, String path, String DBName, int TranCount)
{
	try {
	File f = new File(path);
	if (!f.exists()) 
		f.createNewFile();
	FileWriter fw = new FileWriter(f);
	String s=AlgorithmName+
			"\r\nDatabase: "+DBName+
			"\r\nTransaction count: "+TranCount+
			"\r\n==================================";
	fw.write(s);
	fw.close();
	}catch(IOException e) {
		e.printStackTrace();
	}	
}

public static void SaveToFile(String path, long[][] result, int[] minUtil, float minCor)
{
	try {		
	String s="\r\n-----------------------------------\r\nMincor="+minCor+"\r\n";
	s+="MinUtil ";
	for(int t=0;t<minUtil.length;t++)
		s+=minUtil[t]+" ";
	s+="\r\n";
	File f = new File(path);
	if (!f.exists()) 
		f.createNewFile();
	FileWriter fw = new FileWriter(f,true);
	String[] rowheader=new String[] {"Runtime ","MemoryUsage ","CoHUICount "};
	for(int i=0;i<result.length;i++)
	{
		s+=rowheader[i];
		for(int j=0;j<result[i].length;j++)
		{
			s+=result[i][j]+" ";
		}
		s+="\r\n";
	}
	fw.write(s);
	fw.close();
	} catch(IOException e) {
		e.printStackTrace();
	}
}

public static int getTransactionCount(String filename)
{
	try {
		int linenumber = 0;					 
		File file = new File(filename);
		if (file.exists()) {
			FileReader fr = new FileReader(file);
			LineNumberReader lnr = new LineNumberReader(fr);				
			while (lnr.readLine() != null) {
				linenumber++;
			}
			lnr.close();
		} 
		else {
			System.out.println("File does not exists!");
		}
		return linenumber;
	} catch (IOException e) {
		e.printStackTrace();
	}
	return 0;
}

public static String getDBName(String input)
{
	File f=new File(input);
	String s=f.getName();
	String dbname=s.substring(0, s.indexOf("."));
	return dbname;
}
}
